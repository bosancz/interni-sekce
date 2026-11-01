import { MigrationInterface, QueryRunner } from "typeorm";

export class MemberAchievements1793568435125 implements MigrationInterface {
	name = "MemberAchievements1793568435125";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DELETE FROM "members_achievements"`);
		await queryRunner.query(`ALTER TABLE "members_achievements" DROP COLUMN "date_from"`);
		await queryRunner.query(`ALTER TABLE "members_achievements" DROP COLUMN "date_till"`);
		await queryRunner.query(`ALTER TABLE "members_achievements" ADD "date" date NOT NULL`);
		await queryRunner.query(
			`ALTER TYPE "public"."members_achievements_type_enum" RENAME TO "members_achievements_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."members_achievements_type_enum" AS ENUM('zdravotnik', 'instruktorVodniTuristiky', 'cernySan', 'clunar', 'kormidelnik', 'lodivod')`,
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
		await queryRunner.query(`DELETE FROM "members_achievements"`);
		await queryRunner.query(`DROP INDEX "public"."UQ_members_achievements_member_type"`);
		await queryRunner.query(
			`CREATE TYPE "public"."members_achievements_type_enum_old" AS ENUM('star', 'certificate', 'other')`,
		);
		await queryRunner.query(
			`ALTER TABLE "members_achievements" ALTER COLUMN "type" TYPE "public"."members_achievements_type_enum_old" USING "type"::"text"::"public"."members_achievements_type_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."members_achievements_type_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."members_achievements_type_enum_old" RENAME TO "members_achievements_type_enum"`,
		);
		await queryRunner.query(`ALTER TABLE "members_achievements" DROP COLUMN "date"`);
		await queryRunner.query(`ALTER TABLE "members_achievements" ADD "date_till" date`);
		await queryRunner.query(`ALTER TABLE "members_achievements" ADD "date_from" date`);
	}
}
