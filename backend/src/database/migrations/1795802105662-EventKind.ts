import { MigrationInterface, QueryRunner } from "typeorm";

export class EventKind1795802105662 implements MigrationInterface {
	name = "EventKind1795802105662";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE TYPE "public"."events_kind_enum" AS ENUM('akce', 'tabor', 'putak')`);
		await queryRunner.query(`ALTER TABLE "events" ADD "kind" "public"."events_kind_enum" NOT NULL DEFAULT 'akce'`);
		await queryRunner.query(`ALTER TABLE "events" ADD "camp_theme" text`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "camp_theme"`);
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "kind"`);
		await queryRunner.query(`DROP TYPE "public"."events_kind_enum"`);
	}
}
