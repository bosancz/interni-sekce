import { MigrationInterface, QueryRunner } from "typeorm";

export class EventChronicle1793103744164 implements MigrationInterface {
	name = "EventChronicle1793103744164";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" ADD "chronicle_file_name" character varying`);
		await queryRunner.query(`ALTER TABLE "events" ADD "chronicle_size" integer`);
		await queryRunner.query(`ALTER TABLE "events" ADD "chronicle_updated_at" TIMESTAMP WITH TIME ZONE`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "chronicle_updated_at"`);
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "chronicle_size"`);
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "chronicle_file_name"`);
	}
}
