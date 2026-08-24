import { MigrationInterface, QueryRunner } from "typeorm";

export class EventStatusRejected1787131906960 implements MigrationInterface {
	name = "EventStatusRejected1787131906960";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TYPE "public"."events_status_enum" RENAME TO "events_status_enum_old"`);
		await queryRunner.query(
			`CREATE TYPE "public"."events_status_enum" AS ENUM('draft', 'pending', 'rejected', 'public', 'cancelled')`,
		);
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" DROP DEFAULT`);
		await queryRunner.query(
			`ALTER TABLE "events" ALTER COLUMN "status" TYPE "public"."events_status_enum" USING "status"::"text"::"public"."events_status_enum"`,
		);
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" SET DEFAULT 'draft'`);
		await queryRunner.query(`DROP TYPE "public"."events_status_enum_old"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."events_status_enum_old" AS ENUM('draft', 'pending', 'public', 'cancelled')`,
		);
		await queryRunner.query(`UPDATE "events" SET "status" = 'draft' WHERE "status" = 'rejected'`);
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" DROP DEFAULT`);
		await queryRunner.query(
			`ALTER TABLE "events" ALTER COLUMN "status" TYPE "public"."events_status_enum_old" USING "status"::"text"::"public"."events_status_enum_old"`,
		);
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" SET DEFAULT 'draft'`);
		await queryRunner.query(`DROP TYPE "public"."events_status_enum"`);
		await queryRunner.query(`ALTER TYPE "public"."events_status_enum_old" RENAME TO "events_status_enum"`);
	}
}
