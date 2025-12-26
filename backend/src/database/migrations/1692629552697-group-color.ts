import { MigrationInterface, QueryRunner } from "typeorm";

export class GroupColor1692629552697 implements MigrationInterface {
	name = "GroupColor1692629552697";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "groups" ADD "color" character varying`);
		await queryRunner.query(`ALTER TABLE "groups" ADD "dark_color" character varying`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "dark_color"`);
		await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "color"`);
	}
}
