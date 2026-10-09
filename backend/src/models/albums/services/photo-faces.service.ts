import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { relative, resolve, sep } from "path";
import { PhotoSizes } from "src/api/albums/dto/photo.dto";
import { Config } from "src/config";
import { FilesService } from "src/models/files/services/files.service";
import { Member, MemberRoles } from "src/models/members/entities/member.entity";
import { User } from "src/models/users/entities/user.entity";
import { DataSource, Repository } from "typeorm";
import { PhotoFace } from "../entities/photo-face.entity";
import { Photo } from "../entities/photo.entity";
import {
	DetectedFace,
	DetectFacesJob,
	FaceBox,
	FacesDetectedResult,
	FaceReviewFilter,
	FaceReviewOrder,
	PhotoFaceAssignment,
} from "../schema/detected-faces";
import { PhotosFilesService } from "./photos-files.service";

const ASSIGNED_OVERLAP_IOU = 0.5;

export function faceIou(a: FaceBox, b: FaceBox) {
	const left = Math.max(a.x, b.x);
	const top = Math.max(a.y, b.y);
	const right = Math.min(a.x + a.width, b.x + b.width);
	const bottom = Math.min(a.y + a.height, b.y + b.height);

	const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
	const union = a.width * a.height + b.width * b.height - intersection;

	return union > 0 ? intersection / union : 0;
}

@Injectable()
export class PhotoFacesService {
	constructor(
		@InjectRepository(PhotoFace) private photoFaces: Repository<PhotoFace>,
		@InjectRepository(Photo) private photos: Repository<Photo>,
		private dataSource: DataSource,
		private photosFilesService: PhotosFilesService,
		private filesService: FilesService,
		private config: Config,
	) {}

	async getPhotoFaces(photoId: Photo["id"]) {
		return this.photoFaces
			.createQueryBuilder("faces")
			.leftJoinAndSelect("faces.member", "member")
			.where("faces.photo_id = :photoId", { photoId })
			.orderBy("faces.x", "ASC")
			.getMany();
	}

	async getPhotoFace(photoId: Photo["id"], faceId: PhotoFace["id"]) {
		return this.photoFaces.findOne({ where: { id: faceId, photoId }, relations: { photo: true } });
	}

	async getFace(faceId: PhotoFace["id"]) {
		return this.photoFaces.findOne({ where: { id: faceId }, relations: { photo: true } });
	}

	async assignPhotoFace(faceId: PhotoFace["id"], memberId: Member["id"] | null, assignedById: User["id"] | null) {
		await this.photoFaces.update(faceId, {
			memberId,
			assignment: PhotoFaceAssignment.manual,
			matchScore: null,
			assignedById,
			assignedAt: new Date(),
		});
	}

	async resetPhotoFaceAssignment(faceId: PhotoFace["id"]) {
		await this.photoFaces.update(faceId, {
			memberId: null,
			assignment: null,
			matchScore: null,
			assignedById: null,
			assignedAt: null,
		});
	}

	async deletePhotoFace(faceId: PhotoFace["id"]) {
		await this.photoFaces.delete(faceId);
		await this.photosFilesService.deleteFaceImage(faceId);
	}

	async getMemberPhotos(
		memberId: Member["id"],
		options: { limit?: number; offset?: number; notifiedAt?: number } = {},
	) {
		const query = this.photoFaces
			.createQueryBuilder("faces")
			.innerJoinAndSelect("faces.photo", "photo")
			.innerJoinAndSelect("photo.album", "album")
			.where("faces.member_id = :memberId", { memberId });

		if (options.notifiedAt !== undefined) {
			query.andWhere("faces.notified_member_id = :memberId AND faces.notified_at = :notifiedAt", {
				notifiedAt: new Date(options.notifiedAt),
			});
		}

		const faces = await query
			.orderBy("album.dateFrom", "DESC", "NULLS LAST")
			.addOrderBy("album.id", "DESC")
			.addOrderBy("photo.order", "ASC", "NULLS LAST")
			.addOrderBy("photo.timestamp", "ASC")
			.addOrderBy("photo.id", "ASC")
			.skip(options.offset ?? 0)
			.take(options.limit ?? 50)
			.getMany();

		return faces.map(({ photo, ...face }) => ({ ...photo!, face }));
	}

	async getFaceForReview(
		order: FaceReviewOrder,
		options: {
			filter?: FaceReviewFilter;
			excludePhotoIds?: Photo["id"][];
			memberId?: Member["id"];
			faceId?: PhotoFace["id"];
		} = {},
	) {
		const excludePhotoIds = options.excludePhotoIds ?? [];
		const query = this.getReviewQuery().setParameters({ auto: PhotoFaceAssignment.auto });

		const filter = this.getReviewFilter(options.filter, options.memberId);
		if (filter) query.setParameters(filter.parameters);
		const auto = `faces.assignment = :auto${filter ? ` AND ${filter.condition("member", "faces.member_id")}` : ""}`;
		const candidate = `faces.assignment IS NULL AND ${
			filter
				? filter.condition("candidateMember", "faces.candidate_member_id")
				: "faces.candidate_member_id IS NOT NULL"
		}`;

		switch (order) {
			case FaceReviewOrder.uncertain:
				query.where(auto).orderBy("faces.matchScore", "ASC", "NULLS FIRST");
				break;
			case FaceReviewOrder.candidates:
				query.where(candidate).orderBy("faces.candidateScore", "DESC", "NULLS LAST");
				break;
			case FaceReviewOrder.random:
				query
					.where(
						filter
							? `((${auto}) OR (${candidate}))`
							: "(faces.assignment IS NULL OR faces.assignment = :auto)",
					)
					.orderBy("RANDOM()");
				break;
		}

		const remaining = await query.clone().orderBy().getCount();

		if (options.faceId !== undefined) {
			const face = await this.getReviewQuery().where("faces.id = :faceId", { faceId: options.faceId }).getOne();
			return { face: face ?? null, remaining };
		}

		if (excludePhotoIds.length) query.andWhere("faces.photo_id NOT IN (:...excludePhotoIds)", { excludePhotoIds });

		const face = await query.addOrderBy("faces.id", "ASC").limit(1).getOne();

		return { face: face ?? null, remaining };
	}

	private getReviewQuery() {
		return this.photoFaces
			.createQueryBuilder("faces")
			.innerJoinAndSelect("faces.photo", "photo")
			.leftJoin("photo.album", "album")
			.addSelect(["album.id", "album.name"])
			.leftJoinAndSelect("faces.member", "member")
			.leftJoinAndSelect("faces.candidateMember", "candidateMember");
	}

	private getReviewFilter(filter: FaceReviewFilter | undefined, memberId: Member["id"] | undefined) {
		switch (filter) {
			case FaceReviewFilter.leaders:
				return {
					condition: (alias: string) => `${alias}.role = :reviewRole`,
					parameters: { reviewRole: MemberRoles.vedouci },
				};
			case FaceReviewFilter.children:
				return {
					condition: (alias: string) => `${alias}.role = :reviewRole`,
					parameters: { reviewRole: MemberRoles.dite },
				};
			case FaceReviewFilter.member:
				return {
					condition: (_alias: string, column: string) => `${column} = :reviewMemberId`,
					parameters: { reviewMemberId: memberId ?? null },
				};
			default:
				return null;
		}
	}

	async getDetectionStats() {
		const [photos] = await this.dataSource.query(
			`SELECT count(*)::int AS "total",
				count(faces_detected_at)::int AS "processed",
				count(*) FILTER (WHERE faces_detected_at IS NULL)::int AS "pending",
				count(faces_error)::int AS "failed",
				max(faces_detected_at) AS "lastDetectedAt"
			FROM photos`,
		);
		const [faces] = await this.dataSource.query(
			`SELECT count(*)::int AS "total",
				count(member_id) FILTER (WHERE assignment = 'manual')::int AS "assigned",
				count(member_id) FILTER (WHERE assignment = 'auto')::int AS "autoAssigned"
			FROM photo_faces`,
		);

		return { photos, faces };
	}

	async getDetectionLog(options: { limit?: number; offset?: number } = {}) {
		return this.photos
			.createQueryBuilder("photos")
			.leftJoin("photos.album", "album")
			.addSelect(["album.id", "album.name"])
			.leftJoinAndSelect("photos.faces", "faces")
			.leftJoin("faces.member", "member")
			.addSelect(["member.id", "member.nickname"])
			.where("photos.faces_detected_at IS NOT NULL")
			.orderBy("photos.facesDetectedAt", "DESC")
			.addOrderBy("photos.id", "DESC")
			.addOrderBy("faces.x", "ASC")
			.skip(options.offset ?? 0)
			.take(options.limit ?? 50)
			.getMany();
	}

	async getPhotosForDetection(limit: number) {
		return this.photos
			.createQueryBuilder("photos")
			.where("photos.faces_detected_at IS NULL")
			.andWhere("photos.thumbnails_at IS NOT NULL")
			.orderBy("photos.timestamp", "DESC")
			.addOrderBy("photos.id", "DESC")
			.take(limit)
			.getMany();
	}

	async getDetectionJob(photo: Photo): Promise<DetectFacesJob | null> {
		for (const size of [PhotoSizes.big, PhotoSizes.original]) {
			const path = this.photosFilesService.getPhotoImagePath(photo, size);

			try {
				await this.filesService.fileAccessible(path);
			} catch {
				continue;
			}

			const relativePath = relative(resolve(this.config.fs.dataDir), path);
			if (relativePath.startsWith(".." + sep) || relativePath === "..") {
				throw new Error(`Photo ${photo.id} is stored outside DATA_DIR, the worker cannot read it.`);
			}

			return { photoId: photo.id, path: relativePath.split(sep).join("/") };
		}

		return null;
	}

	async markDetectionFailed(photoId: Photo["id"], model: string | null, error: string) {
		await this.photos.update(photoId, { facesDetectedAt: new Date(), facesModel: model, facesError: error });
	}

	async saveDetectedFaces(result: FacesDetectedResult) {
		const removedFaceIds = await this.dataSource.transaction(async (t) => {
			const photo = await t.findOneBy(Photo, { id: result.photoId });
			if (!photo) return [];

			if (result.error !== undefined) {
				await t.update(Photo, photo.id, {
					facesDetectedAt: new Date(),
					facesModel: result.model,
					facesError: result.error.slice(0, 1000),
				});
				return [];
			}

			const existing = await t.findBy(PhotoFace, { photoId: photo.id });
			const assigned = existing.filter((face) => face.assignment !== null);
			const unassigned = existing.filter((face) => face.assignment === null);

			if (unassigned.length)
				await t.delete(
					PhotoFace,
					unassigned.map((face) => face.id),
				);

			const detected = (face: DetectedFace) => ({
				x: face.x,
				y: face.y,
				width: face.width,
				height: face.height,
				score: face.score,
				descriptor: face.descriptor?.length ? face.descriptor : null,
				emotions: face.emotions ?? null,
				emotion: face.emotion ?? null,
				model: result.model,
			});

			const matched = new Set<number>();
			const created: PhotoFace[] = [];

			for (const face of result.faces) {
				const match = assigned
					.filter((a) => !matched.has(a.id))
					.map((a) => ({ face: a, iou: faceIou(a, face) }))
					.filter((m) => m.iou > ASSIGNED_OVERLAP_IOU)
					.sort((a, b) => b.iou - a.iou)[0];

				if (match) {
					matched.add(match.face.id);
					await t.update(PhotoFace, match.face.id, detected(face));
				} else {
					created.push(t.create(PhotoFace, { photoId: photo.id, memberId: null, ...detected(face) }));
				}
			}

			if (created.length) await t.save(PhotoFace, created);

			await t.update(Photo, photo.id, {
				facesDetectedAt: new Date(),
				facesModel: result.model,
				facesError: null,
			});

			return [...unassigned.map((face) => face.id), ...matched];
		});

		await Promise.all(removedFaceIds.map((id) => this.photosFilesService.deleteFaceImage(id)));
	}
}
