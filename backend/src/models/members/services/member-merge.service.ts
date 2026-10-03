import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { Config } from "src/config";
import { PhotoFaceAssignment } from "src/models/albums/schema/detected-faces";
import { EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { FilesService } from "src/models/files/services/files.service";
import { DataSource, EntityManager } from "typeorm";
import { Member } from "../entities/member.entity";

export enum MemberMergeFields {
	nickname = "nickname",
	firstName = "firstName",
	lastName = "lastName",
	groupId = "groupId",
	role = "role",
	rank = "rank",
	function = "function",
	active = "active",
	birthday = "birthday",
	address = "address",
	mobile = "mobile",
	email = "email",
	knownProblems = "knownProblems",
	allergies = "allergies",
	insuranceCard = "insuranceCard",
	profilePhoto = "profilePhoto",
	user = "user",
}

const MEMBER_MERGE_COLUMNS: Record<Exclude<MemberMergeFields, MemberMergeFields.user>, (keyof Member)[]> = {
	nickname: ["nickname"],
	firstName: ["firstName"],
	lastName: ["lastName"],
	groupId: ["groupId"],
	role: ["role"],
	rank: ["rank"],
	function: ["function"],
	active: ["active"],
	birthday: ["birthday"],
	address: ["addressStreet", "addressStreetNo", "addressCity", "addressPostalCode", "addressCountry"],
	mobile: ["mobile"],
	email: ["email"],
	knownProblems: ["knownProblems"],
	allergies: ["allergies"],
	insuranceCard: ["insuranceCardFile", "insuranceCardExpiration"],
	profilePhoto: ["profilePhotoFaceId", "profilePhotoUpdatedAt"],
};

export interface MemberMergeSide {
	memberId: number;
	attendeeEvents: number;
	leaderEvents: number;
	photoFaces: number;
	contacts: number;
	achievements: number;
	membershipYears: number[];
	user: { id: number; login: string } | null;
}

export interface MemberMergeInfo {
	target: MemberMergeSide;
	source: MemberMergeSide;
	sharedEvents: number;
	sharedMembershipYears: number[];
}

export interface MemberMergeResult {
	manualFaces: number;
}

@Injectable()
export class MemberMergeService {
	private logger = new Logger(MemberMergeService.name);

	constructor(
		@InjectDataSource() private dataSource: DataSource,
		private filesService: FilesService,
		private config: Config,
	) {}

	async getMergeInfo(targetId: number, sourceId: number): Promise<MemberMergeInfo> {
		this.assertDifferent(targetId, sourceId);

		const [target, source] = await Promise.all([this.getSide(targetId), this.getSide(sourceId)]);

		const [{ count: sharedEvents }] = await this.dataSource.query(
			`SELECT count(*)::int AS "count" FROM events_attendees t
			JOIN events_attendees s ON s.event_id = t.event_id AND s.member_id = $2
			WHERE t.member_id = $1`,
			[targetId, sourceId],
		);

		return {
			target,
			source,
			sharedEvents,
			sharedMembershipYears: target.membershipYears.filter((year) => source.membershipYears.includes(year)),
		};
	}

	async mergeMembers(
		targetId: number,
		sourceId: number,
		fieldsFromSource: MemberMergeFields[],
	): Promise<MemberMergeResult> {
		this.assertDifferent(targetId, sourceId);

		const fields = new Set(fieldsFromSource);

		const { target, source, manualFaces } = await this.dataSource.transaction(async (t) => {
			const target = await t.findOne(Member, { where: { id: targetId } });
			const source = await t.findOne(Member, { where: { id: sourceId }, withDeleted: true });
			if (!target || !source) throw new NotFoundException();

			await this.copyFields(t, target, source, fields);
			await this.mergeEventAttendees(t, targetId, sourceId);
			const manualFaces = await this.mergePhotoFaces(t, targetId, sourceId);
			await this.mergeContacts(t, targetId, sourceId);
			await t.query(`UPDATE members_achievements SET member_id = $1 WHERE member_id = $2`, [targetId, sourceId]);
			await this.mergeMembershipPayments(t, targetId, sourceId);
			await this.mergeUser(t, targetId, sourceId, fields.has(MemberMergeFields.user));

			await t.delete(Member, { id: sourceId });

			return { target, source, manualFaces };
		});

		await this.mergeFiles(target, source, fields).catch((err) =>
			this.logger.error(`Moving files of member ${sourceId} to member ${targetId} failed: ${err}`),
		);

		this.logger.log(`Member ${sourceId} merged into member ${targetId}.`);

		return { manualFaces };
	}

	private assertDifferent(targetId: number, sourceId: number) {
		if (targetId === sourceId) throw new BadRequestException("Člena nejde sloučit se sebou samým.");
	}

	private async getSide(memberId: number): Promise<MemberMergeSide> {
		const exists = await this.dataSource
			.getRepository(Member)
			.exists({ where: { id: memberId }, withDeleted: true });
		if (!exists) throw new NotFoundException();

		const [counts] = await this.dataSource.query(
			`SELECT
				(SELECT count(*)::int FROM events_attendees WHERE member_id = $1 AND type = $2) AS "attendeeEvents",
				(SELECT count(*)::int FROM events_attendees WHERE member_id = $1 AND type = $3) AS "leaderEvents",
				(SELECT count(*)::int FROM photo_faces WHERE member_id = $1) AS "photoFaces",
				(SELECT count(*)::int FROM members_contacts WHERE member_id = $1) AS "contacts",
				(SELECT count(*)::int FROM members_achievements WHERE member_id = $1) AS "achievements"`,
			[memberId, EventAttendeeType.attendee, EventAttendeeType.leader],
		);

		const years: { forYear: number }[] = await this.dataSource.query(
			`SELECT for_year AS "forYear" FROM membership_payments WHERE member_id = $1 ORDER BY for_year DESC`,
			[memberId],
		);

		const [user] = await this.dataSource.query(`SELECT id, login FROM users WHERE member_id = $1`, [memberId]);

		return {
			memberId,
			...counts,
			membershipYears: years.map((row) => Number(row.forYear)),
			user: user ?? null,
		};
	}

	private async copyFields(t: EntityManager, target: Member, source: Member, fields: Set<MemberMergeFields>) {
		const data: Partial<Member> = {};

		for (const [field, columns] of Object.entries(MEMBER_MERGE_COLUMNS)) {
			if (!fields.has(field as MemberMergeFields)) continue;
			for (const column of columns) (data as any)[column] = source[column];
		}

		if (fields.has(MemberMergeFields.profilePhoto) && source.profilePhotoUpdatedAt)
			data.profilePhotoUpdatedAt = new Date();

		if (Object.keys(data).length) await t.update(Member, { id: target.id }, data);
	}

	private async mergeEventAttendees(t: EntityManager, targetId: number, sourceId: number) {
		await t.query(
			`UPDATE events_attendees ta SET type = $3, position = coalesce(ta.position, sa.position)
			FROM events_attendees sa
			WHERE ta.member_id = $1 AND sa.member_id = $2 AND sa.event_id = ta.event_id AND sa.type = $3 AND ta.type <> $3`,
			[targetId, sourceId, EventAttendeeType.leader],
		);

		await t.query(
			`DELETE FROM events_attendees sa
			WHERE sa.member_id = $2 AND EXISTS (SELECT 1 FROM events_attendees ta WHERE ta.member_id = $1 AND ta.event_id = sa.event_id)`,
			[targetId, sourceId],
		);

		await t.query(`UPDATE events_attendees SET member_id = $1 WHERE member_id = $2`, [targetId, sourceId]);
	}

	private async mergePhotoFaces(t: EntityManager, targetId: number, sourceId: number) {
		const [{ count }] = await t.query(
			`SELECT count(*)::int AS "count" FROM photo_faces WHERE member_id = $1 AND assignment = $2`,
			[sourceId, PhotoFaceAssignment.manual],
		);

		await t.query(`UPDATE photo_faces SET member_id = $1 WHERE member_id = $2`, [targetId, sourceId]);
		await t.query(`UPDATE photo_faces SET candidate_member_id = $1 WHERE candidate_member_id = $2`, [
			targetId,
			sourceId,
		]);
		await t.query(`UPDATE photo_faces SET notified_member_id = $1 WHERE notified_member_id = $2`, [
			targetId,
			sourceId,
		]);

		return count as number;
	}

	private async mergeContacts(t: EntityManager, targetId: number, sourceId: number) {
		await t.query(
			`UPDATE members_contacts SET is_default = false
			WHERE member_id = $2 AND EXISTS (SELECT 1 FROM members_contacts WHERE member_id = $1 AND is_default)`,
			[targetId, sourceId],
		);

		await t.query(`UPDATE members_contacts SET member_id = $1 WHERE member_id = $2`, [targetId, sourceId]);
	}

	private async mergeMembershipPayments(t: EntityManager, targetId: number, sourceId: number) {
		await t.query(
			`DELETE FROM membership_payments sp
			WHERE sp.member_id = $2 AND EXISTS (SELECT 1 FROM membership_payments tp WHERE tp.member_id = $1 AND tp.for_year = sp.for_year)`,
			[targetId, sourceId],
		);

		await t.query(`UPDATE membership_payments SET member_id = $1 WHERE member_id = $2`, [targetId, sourceId]);
	}

	private async mergeUser(t: EntityManager, targetId: number, sourceId: number, fromSource: boolean) {
		if (!fromSource) {
			await t.query(`UPDATE users SET member_id = NULL WHERE member_id = $1`, [sourceId]);
			return;
		}

		await t.query(`UPDATE users SET member_id = NULL WHERE member_id = $1`, [targetId]);
		await t.query(`UPDATE users SET member_id = $1 WHERE member_id = $2`, [targetId, sourceId]);
	}

	private async mergeFiles(target: Member, source: Member, fields: Set<MemberMergeFields>) {
		if (fields.has(MemberMergeFields.insuranceCard)) {
			if (target.insuranceCardFile)
				await this.deleteFile(this.getInsuranceCardPath(target.id, target.insuranceCardFile));
			if (source.insuranceCardFile)
				await this.filesService.moveFile(
					this.getInsuranceCardPath(source.id, source.insuranceCardFile),
					this.getInsuranceCardPath(target.id, source.insuranceCardFile),
				);
		}

		if (fields.has(MemberMergeFields.profilePhoto)) {
			await this.deleteFile(this.getProfilePhotoPath(target.id));
			if (source.profilePhotoUpdatedAt)
				await this.filesService.moveFile(
					this.getProfilePhotoPath(source.id),
					this.getProfilePhotoPath(target.id),
				);
		}

		const sourceDir = this.getMemberDir(source.id);
		await this.filesService.deleteFilesByPrefix(sourceDir, "");
		await this.filesService.deleteDir(sourceDir).catch(() => {});
	}

	private async deleteFile(path: string) {
		await this.filesService.deleteFile(path).catch(() => {});
	}

	private getMemberDir(memberId: number) {
		return `${this.config.fs.membersDir}/${memberId}`;
	}

	private getInsuranceCardPath(memberId: number, extension: string) {
		return `${this.getMemberDir(memberId)}/insurance_card.${extension}`;
	}

	private getProfilePhotoPath(memberId: number) {
		return `${this.getMemberDir(memberId)}/profile_photo.jpg`;
	}
}
