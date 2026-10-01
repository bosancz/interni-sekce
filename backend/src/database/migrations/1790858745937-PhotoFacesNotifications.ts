import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotoFacesNotifications1790858745937 implements MigrationInterface {
	name = "PhotoFacesNotifications1790858745937";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "notified_member_id" integer`);
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "notified_at" TIMESTAMP WITH TIME ZONE`);
		await queryRunner.query(
			`UPDATE "photo_faces" SET "notified_member_id" = "member_id" WHERE "member_id" IS NOT NULL`,
		);
		await queryRunner.query(
			`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notifications_type_enum" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
		await queryRunner.query(
			`ALTER TYPE "public"."notification_settings_type_enum" RENAME TO "notification_settings_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notification_settings_type_enum" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notification_settings" ALTER COLUMN "type" TYPE "public"."notification_settings_type_enum" USING "type"::"text"::"public"."notification_settings_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notification_settings_type_enum_old"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DELETE FROM "notifications" WHERE "type" IN ('myPhotos', 'newAlbums')`);
		await queryRunner.query(`DELETE FROM "notification_settings" WHERE "type" IN ('myPhotos', 'newAlbums')`);
		await queryRunner.query(
			`CREATE TYPE "public"."notification_settings_type_enum_old" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newUsers', 'myBugReports')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notification_settings" ALTER COLUMN "type" TYPE "public"."notification_settings_type_enum_old" USING "type"::"text"::"public"."notification_settings_type_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notification_settings_type_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."notification_settings_type_enum_old" RENAME TO "notification_settings_type_enum"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newUsers', 'myBugReports')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`,
		);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "notified_at"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "notified_member_id"`);
	}
}
