import { MigrationInterface, QueryRunner } from "typeorm";

export class GroupChildren1788272051249 implements MigrationInterface {
	name = "GroupChildren1788272051249";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "groups" ADD "children" boolean NOT NULL DEFAULT true`);
		await queryRunner.query(`UPDATE "groups" SET "children" = false WHERE "short_name" IN ('KP', 'V')`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "children"`);
	}
}
