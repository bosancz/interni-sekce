import { MigrationInterface, QueryRunner } from "typeorm";

export class EventReportRevizorFields1792768891178 implements MigrationInterface {
	name = "EventReportRevizorFields1792768891178";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" ADD "report_published_at" TIMESTAMP WITH TIME ZONE`);
		await queryRunner.query(`ALTER TABLE "events" ADD "report_complications" text`);
		await queryRunner.query(`ALTER TABLE "events" ADD "report_praises" text`);
		await queryRunner.query(`ALTER TABLE "events" ADD "report_complaints" text`);
		await queryRunner.query(
			`UPDATE "events" SET "report_published_at" = ("date_till" + 1)::timestamp AT TIME ZONE 'Europe/Prague' WHERE coalesce(trim("report"), '') <> ''`,
		);
		await queryRunner.query(
			`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notifications_type_enum" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newEventReports', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
		await queryRunner.query(
			`ALTER TYPE "public"."notification_settings_type_enum" RENAME TO "notification_settings_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notification_settings_type_enum" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newEventReports', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notification_settings" ALTER COLUMN "type" TYPE "public"."notification_settings_type_enum" USING "type"::"text"::"public"."notification_settings_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notification_settings_type_enum_old"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DELETE FROM "notification_settings" WHERE "type" = 'newEventReports'`);
		await queryRunner.query(`DELETE FROM "notifications" WHERE "type" = 'newEventReports'`);
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
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "report_complaints"`);
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "report_praises"`);
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "report_complications"`);
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "report_published_at"`);
	}
}
