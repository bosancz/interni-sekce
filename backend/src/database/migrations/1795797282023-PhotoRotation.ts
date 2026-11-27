import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotoRotation1795797282023 implements MigrationInterface {
	name = "PhotoRotation1795797282023";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photos" ADD "rotation" smallint NOT NULL DEFAULT '0'`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "rotation"`);
	}
}
