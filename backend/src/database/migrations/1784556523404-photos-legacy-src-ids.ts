import { MigrationInterface, QueryRunner } from "typeorm";

export class photosLegacySrcIds1784556523404 implements MigrationInterface {
	name = "photosLegacySrcIds1784556523404";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photos" ADD "src_album_id" character varying`);
		await queryRunner.query(`ALTER TABLE "photos" ADD "src_id" character varying`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "src_id"`);
		await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "src_album_id"`);
	}
}
