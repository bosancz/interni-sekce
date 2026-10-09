import { MigrationInterface, QueryRunner } from "typeorm";

export class MemberBadges1791554588337 implements MigrationInterface {
	name = "MemberBadges1791554588337";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "members_badges" ("id" SERIAL NOT NULL, "member_id" integer NOT NULL, "badge" character varying NOT NULL, "level" integer NOT NULL, "earned_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "seen_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_5ab3d4b3758610134ac86dc7a36" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_54a2ecf3ca14ec255a476475a4" ON "members_badges" ("member_id", "badge", "level") `,
		);
		await queryRunner.query(
			`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notifications_type_enum" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums', 'myBadges')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
		await queryRunner.query(
			`ALTER TYPE "public"."notification_settings_type_enum" RENAME TO "notification_settings_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notification_settings_type_enum" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums', 'myBadges')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notification_settings" ALTER COLUMN "type" TYPE "public"."notification_settings_type_enum" USING "type"::"text"::"public"."notification_settings_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notification_settings_type_enum_old"`);
		await queryRunner.query(
			`ALTER TABLE "members_badges" ADD CONSTRAINT "FK_fb37cfecaa16387c70d1357c85c" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "members_badges" DROP CONSTRAINT "FK_fb37cfecaa16387c70d1357c85c"`);
		await queryRunner.query(`DELETE FROM "notification_settings" WHERE "type" = 'myBadges'`);
		await queryRunner.query(`DELETE FROM "notifications" WHERE "type" = 'myBadges'`);
		await queryRunner.query(
			`CREATE TYPE "public"."notification_settings_type_enum_old" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notification_settings" ALTER COLUMN "type" TYPE "public"."notification_settings_type_enum_old" USING "type"::"text"::"public"."notification_settings_type_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notification_settings_type_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."notification_settings_type_enum_old" RENAME TO "notification_settings_type_enum"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_54a2ecf3ca14ec255a476475a4"`);
		await queryRunner.query(`DROP TABLE "members_badges"`);
	}
}
