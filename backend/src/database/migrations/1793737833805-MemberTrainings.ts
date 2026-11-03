import { MigrationInterface, QueryRunner } from "typeorm";

export class MemberTrainings1793737833805 implements MigrationInterface {
	name = "MemberTrainings1793737833805";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."members_trainings_type_enum" AS ENUM('zdravotnik', 'instruktorVodniTuristiky', 'lanac', 'custom')`,
		);
		await queryRunner.query(
			`CREATE TABLE "members_trainings" ("id" SERIAL NOT NULL, "member_id" integer NOT NULL, "type" "public"."members_trainings_type_enum" NOT NULL, "name" character varying, "issued_on" date, "valid_until" date, "issuer" character varying, CONSTRAINT "PK_5d7a1cc15ef15237d85666fe6d0" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`CREATE INDEX "IDX_members_trainings_member_id" ON "members_trainings" ("member_id") `);
		await queryRunner.query(
			`INSERT INTO "members_trainings" ("member_id", "type", "issued_on") SELECT "member_id", "type"::text::"public"."members_trainings_type_enum", "date" FROM "members_achievements" WHERE "type" IN ('zdravotnik', 'instruktorVodniTuristiky')`,
		);
		await queryRunner.query(
			`DELETE FROM "members_achievements" WHERE "type" IN ('zdravotnik', 'instruktorVodniTuristiky')`,
		);
		await queryRunner.query(`ALTER TABLE "members_achievements" DROP COLUMN "date"`);
		await queryRunner.query(`DROP INDEX "public"."UQ_members_achievements_member_type"`);
		await queryRunner.query(
			`ALTER TYPE "public"."members_achievements_type_enum" RENAME TO "members_achievements_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."members_achievements_type_enum" AS ENUM('novackovskaZkouska', 'hvezda1', 'hvezda2', 'hvezda3', 'hvezda4', 'cernySan', 'clunar', 'kormidelnik', 'lodivod')`,
		);
		await queryRunner.query(
			`ALTER TABLE "members_achievements" ALTER COLUMN "type" TYPE "public"."members_achievements_type_enum" USING "type"::"text"::"public"."members_achievements_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."members_achievements_type_enum_old"`);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_members_achievements_member_type" ON "members_achievements" ("member_id", "type") `,
		);
		await queryRunner.query(
			`ALTER TABLE "members_trainings" ADD CONSTRAINT "FK_7da6ed42ef555a1989421935e0e" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "members_trainings" DROP CONSTRAINT "FK_7da6ed42ef555a1989421935e0e"`);
		await queryRunner.query(`DROP INDEX "public"."UQ_members_achievements_member_type"`);
		await queryRunner.query(
			`CREATE TYPE "public"."members_achievements_type_enum_old" AS ENUM('zdravotnik', 'instruktorVodniTuristiky', 'novackovskaZkouska', 'hvezda1', 'hvezda2', 'hvezda3', 'hvezda4', 'cernySan', 'clunar', 'kormidelnik', 'lodivod')`,
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
		await queryRunner.query(`ALTER TABLE "members_achievements" ADD "date" date NOT NULL DEFAULT CURRENT_DATE`);
		await queryRunner.query(`ALTER TABLE "members_achievements" ALTER COLUMN "date" DROP DEFAULT`);
		await queryRunner.query(
			`INSERT INTO "members_achievements" ("member_id", "type", "date") SELECT DISTINCT ON ("member_id", "type") "member_id", "type"::text::"public"."members_achievements_type_enum", COALESCE("issued_on", CURRENT_DATE) FROM "members_trainings" WHERE "type" IN ('zdravotnik', 'instruktorVodniTuristiky') ORDER BY "member_id", "type", "issued_on" DESC NULLS LAST`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_members_trainings_member_id"`);
		await queryRunner.query(`DROP TABLE "members_trainings"`);
		await queryRunner.query(`DROP TYPE "public"."members_trainings_type_enum"`);
	}
}
