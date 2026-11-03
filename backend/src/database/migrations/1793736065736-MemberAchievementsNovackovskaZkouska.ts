import { MigrationInterface, QueryRunner } from "typeorm";

export class MemberAchievementsNovackovskaZkouska1793736065736 implements MigrationInterface {
	name = "MemberAchievementsNovackovskaZkouska1793736065736";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."UQ_members_achievements_member_type"`);
		await queryRunner.query(
			`ALTER TYPE "public"."members_achievements_type_enum" RENAME TO "members_achievements_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."members_achievements_type_enum" AS ENUM('zdravotnik', 'instruktorVodniTuristiky', 'novackovskaZkouska', 'hvezda1', 'hvezda2', 'hvezda3', 'hvezda4', 'cernySan', 'clunar', 'kormidelnik', 'lodivod')`,
		);
		await queryRunner.query(
			`ALTER TABLE "members_achievements" ALTER COLUMN "type" TYPE "public"."members_achievements_type_enum" USING "type"::"text"::"public"."members_achievements_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."members_achievements_type_enum_old"`);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_members_achievements_member_type" ON "members_achievements" ("member_id", "type") `,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DELETE FROM "members_achievements" WHERE "type" IN ('novackovskaZkouska', 'hvezda1', 'hvezda2', 'hvezda3', 'hvezda4')`,
		);
		await queryRunner.query(`DROP INDEX "public"."UQ_members_achievements_member_type"`);
		await queryRunner.query(
			`CREATE TYPE "public"."members_achievements_type_enum_old" AS ENUM('zdravotnik', 'instruktorVodniTuristiky', 'cernySan', 'clunar', 'kormidelnik', 'lodivod')`,
		);
		await queryRunner.query(
			`ALTER TABLE "members_achievements" ALTER COLUMN "type" TYPE "public"."members_achievements_type_enum_old" USING "type"::"text"::"public"."members_achievements_type_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."members_achievements_type_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."members_achievements_type_enum_old" RENAME TO "members_achievements_type_enum"`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_members_achievements_member_type" ON "members_achievements" ("member_id", "type") `,
		);
	}
}
