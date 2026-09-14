import { MigrationInterface, QueryRunner } from "typeorm";

export class BugReports1788273486142 implements MigrationInterface {
    name = 'BugReports1788273486142'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bug_reports" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "repo" character varying NOT NULL, "issue_number" integer NOT NULL, "title" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "notified_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_ad13bef7131f2fed8b2fb9fbb00" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f85c23d575968240a49c0dd706" ON "bug_reports" ("repo", "issue_number") `);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newUsers', 'myBugReports')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."notification_settings_type_enum" RENAME TO "notification_settings_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notification_settings_type_enum" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newUsers', 'myBugReports')`);
        await queryRunner.query(`ALTER TABLE "notification_settings" ALTER COLUMN "type" TYPE "public"."notification_settings_type_enum" USING "type"::"text"::"public"."notification_settings_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_settings_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "bug_reports" ADD CONSTRAINT "FK_d2be4fe51a0c6ebaa2c4a74c093" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bug_reports" DROP CONSTRAINT "FK_d2be4fe51a0c6ebaa2c4a74c093"`);
        await queryRunner.query(`DELETE FROM "notifications" WHERE "type" = 'myBugReports'`);
        await queryRunner.query(`DELETE FROM "notification_settings" WHERE "type" = 'myBugReports'`);
        await queryRunner.query(`CREATE TYPE "public"."notification_settings_type_enum_old" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newUsers')`);
        await queryRunner.query(`ALTER TABLE "notification_settings" ALTER COLUMN "type" TYPE "public"."notification_settings_type_enum_old" USING "type"::"text"::"public"."notification_settings_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notification_settings_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notification_settings_type_enum_old" RENAME TO "notification_settings_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newUsers')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f85c23d575968240a49c0dd706"`);
        await queryRunner.query(`DROP TABLE "bug_reports"`);
    }

}
