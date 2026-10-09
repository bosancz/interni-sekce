import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotoThumbnails1791527475962 implements MigrationInterface {
	name = "PhotoThumbnails1791527475962";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photos" ADD "thumbnails_at" TIMESTAMP WITH TIME ZONE`);
		await queryRunner.query(`ALTER TABLE "photos" ADD "thumbnails_error" character varying`);
		await queryRunner.query(`UPDATE "photos" SET "thumbnails_at" = now()`);
		await queryRunner.query(
			`CREATE INDEX "IDX_photos_thumbnails_pending" ON "photos" ("id") WHERE thumbnails_at IS NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_photos_thumbnails_pending"`);
		await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "thumbnails_error"`);
		await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "thumbnails_at"`);
	}
}
