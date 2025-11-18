import { MigrationInterface, QueryRunner } from "typeorm";

export class GroupsSoftDelete1689015324889 implements MigrationInterface {
	name = "GroupsSoftDelete1689015324889";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "groups" ADD "deleted_at" TIMESTAMP`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "deleted_at"`);
	}
}
