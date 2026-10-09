import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotoExif1791553765164 implements MigrationInterface {
	name = "PhotoExif1791553765164";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photos" ADD "exif" jsonb`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "exif"`);
	}
}
