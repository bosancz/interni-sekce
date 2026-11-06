import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationTypesMyBadges1793976064683 implements MigrationInterface {
	name = "NotificationTypesMyBadges1793976064683";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notifications_type_enum" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newEventReports', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums', 'myBadges', 'backups')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
		await queryRunner.query(
			`ALTER TYPE "public"."notification_settings_type_enum" RENAME TO "notification_settings_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notification_settings_type_enum" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newEventReports', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums', 'myBadges', 'backups')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notification_settings" ALTER COLUMN "type" TYPE "public"."notification_settings_type_enum" USING "type"::"text"::"public"."notification_settings_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notification_settings_type_enum_old"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DELETE FROM "notification_settings" WHERE "type" = 'myBadges'`);
		await queryRunner.query(`DELETE FROM "notifications" WHERE "type" = 'myBadges'`);
		await queryRunner.query(
			`CREATE TYPE "public"."notification_settings_type_enum_old" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newEventReports', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums', 'backups')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notification_settings" ALTER COLUMN "type" TYPE "public"."notification_settings_type_enum_old" USING "type"::"text"::"public"."notification_settings_type_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notification_settings_type_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."notification_settings_type_enum_old" RENAME TO "notification_settings_type_enum"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newEventReports', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums', 'backups')`,
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
