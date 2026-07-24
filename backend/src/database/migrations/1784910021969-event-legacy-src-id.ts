import { MigrationInterface, QueryRunner } from "typeorm";

export class eventLegacySrcId1784910021969 implements MigrationInterface {
	name = "eventLegacySrcId1784910021969";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" ADD "src_id" character varying`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "src_id"`);
	}
}
