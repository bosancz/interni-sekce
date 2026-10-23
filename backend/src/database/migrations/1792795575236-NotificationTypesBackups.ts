import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationTypesBackups1792795575236 implements MigrationInterface {
	name = "NotificationTypesBackups1792795575236";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notifications_type_enum" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newEventReports', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums', 'backups')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
		await queryRunner.query(
			`ALTER TYPE "public"."notification_settings_type_enum" RENAME TO "notification_settings_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notification_settings_type_enum" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newEventReports', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums', 'backups')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notification_settings" ALTER COLUMN "type" TYPE "public"."notification_settings_type_enum" USING "type"::"text"::"public"."notification_settings_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notification_settings_type_enum_old"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DELETE FROM "notification_settings" WHERE "type" = 'backups'`);
		await queryRunner.query(`DELETE FROM "notifications" WHERE "type" = 'backups'`);
		await queryRunner.query(
			`CREATE TYPE "public"."notification_settings_type_enum_old" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newEventReports', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notification_settings" ALTER COLUMN "type" TYPE "public"."notification_settings_type_enum_old" USING "type"::"text"::"public"."notification_settings_type_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notification_settings_type_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."notification_settings_type_enum_old" RENAME TO "notification_settings_type_enum"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newEventReports', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`,
		);
	}
}
