import { MigrationInterface, QueryRunner } from "typeorm";

export class BackupRuns1792765713199 implements MigrationInterface {
	name = "BackupRuns1792765713199";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "backup_schedule" ("id" integer NOT NULL DEFAULT '1', "cron" character varying, "timezone" character varying, "next_run_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_45d8f7ee9bb3e91ca65c7df5dd6" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`CREATE TYPE "public"."backup_runs_type_enum" AS ENUM('database', 'files')`);
		await queryRunner.query(`CREATE TYPE "public"."backup_runs_status_enum" AS ENUM('running', 'ok', 'error')`);
		await queryRunner.query(
			`CREATE TABLE "backup_runs" ("id" SERIAL NOT NULL, "type" "public"."backup_runs_type_enum" NOT NULL, "status" "public"."backup_runs_status_enum" NOT NULL DEFAULT 'running', "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "finished_at" TIMESTAMP WITH TIME ZONE, "file_name" character varying, "bytes" bigint, "files_transferred" integer, "files_removed" integer, "error" text, CONSTRAINT "PK_fae0096e47c04baf8723aa492e1" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_79d211ad8a77a0f125ec7b6f8f" ON "backup_runs" ("type", "started_at") `,
		);
		await queryRunner.query(
			`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notifications_type_enum" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums', 'backups')`,
		);
		await queryRunner.query(
			`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
		await queryRunner.query(
			`ALTER TYPE "public"."notification_settings_type_enum" RENAME TO "notification_settings_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."notification_settings_type_enum" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newUsers', 'myBugReports', 'myPhotos', 'newAlbums', 'backups')`,
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
		await queryRunner.query(`DROP INDEX "public"."IDX_79d211ad8a77a0f125ec7b6f8f"`);
		await queryRunner.query(`DROP TABLE "backup_runs"`);
		await queryRunner.query(`DROP TYPE "public"."backup_runs_status_enum"`);
		await queryRunner.query(`DROP TYPE "public"."backup_runs_type_enum"`);
		await queryRunner.query(`DROP TABLE "backup_schedule"`);
	}
}
