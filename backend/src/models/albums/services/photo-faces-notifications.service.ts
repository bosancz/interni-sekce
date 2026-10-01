import { Injectable, Logger } from "@nestjs/common";
import { Config } from "src/config";
import { NotificationsService } from "src/models/notifications/services/notifications.service";
import { DataSource } from "typeorm";

interface NewMemberPhotoRow {
	faceId: number;
	memberId: number;
	photoId: number;
	albumName: string;
	selfAssigned: boolean;
}

@Injectable()
export class PhotoFacesNotificationsService {
	private logger = new Logger(PhotoFacesNotificationsService.name);

	constructor(
		private dataSource: DataSource,
		private notificationsService: NotificationsService,
		private config: Config,
	) {}

	async notifyNewPhotos() {
		const notifiedAt = new Date();

		const rows: NewMemberPhotoRow[] = await this.dataSource.query(
			`SELECT f.id AS "faceId", f.member_id AS "memberId", p.id AS "photoId", a.name AS "albumName",
				EXISTS (SELECT 1 FROM users u WHERE u.member_id = f.member_id AND u.id = f.assigned_by_id) AS "selfAssigned"
			FROM photo_faces f
			JOIN photos p ON p.id = f.photo_id
			JOIN albums a ON a.id = p.album_id AND a.deleted_at IS NULL
			WHERE f.member_id IS NOT NULL AND f.member_id IS DISTINCT FROM f.notified_member_id
			ORDER BY p.album_id, p.order, p.id`,
		);

		const byMember = new Map<number, NewMemberPhotoRow[]>();
		for (const row of rows) {
			const memberRows = byMember.get(row.memberId) ?? [];
			memberRows.push(row);
			byMember.set(row.memberId, memberRows);
		}

		let notified = 0;

		for (const [memberId, memberRows] of byMember) {
			const announced = this.config.notifications.notifyActor
				? memberRows
				: memberRows.filter((row) => !row.selfAssigned);
			const silent = memberRows.filter((row) => !announced.includes(row));

			try {
				if (announced.length) {
					const albums = [...new Set(announced.map((row) => row.albumName))];
					const photos = new Set(announced.map((row) => row.photoId)).size;
					notified += await this.notificationsService.onMemberPhotosMatched(
						memberId,
						photos,
						albums,
						notifiedAt,
					);
				}

				await this.markNotified(announced, notifiedAt);
				await this.markNotified(silent, null);
			} catch (err) {
				this.logger.error(`Failed to notify member ${memberId} about new photos: ${err}`);
			}
		}

		this.logger.log(`Notified ${notified} users about new photos of ${byMember.size} members.`);
		return { members: byMember.size, notified };
	}

	private async markNotified(rows: NewMemberPhotoRow[], notifiedAt: Date | null) {
		if (!rows.length) return;

		await this.dataSource.query(
			`UPDATE photo_faces f SET notified_member_id = v.member_id, notified_at = $3
			FROM unnest($1::int[], $2::int[]) AS v(id, member_id)
			WHERE f.id = v.id AND f.member_id = v.member_id`,
			[rows.map((row) => row.faceId), rows.map((row) => row.memberId), notifiedAt],
		);
	}
}
