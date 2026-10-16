import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotosDropTitle1792141307008 implements MigrationInterface {
	name = "PhotosDropTitle1792141307008";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`UPDATE "photos" SET "caption" = TRIM("title") WHERE COALESCE(TRIM("caption"), '') = '' AND COALESCE(TRIM("title"), '') <> ''`,
		);
		await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "title"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photos" ADD "title" text`);
	}
}
