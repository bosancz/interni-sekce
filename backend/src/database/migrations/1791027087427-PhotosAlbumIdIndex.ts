import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotosAlbumIdIndex1791027087427 implements MigrationInterface {
	name = "PhotosAlbumIdIndex1791027087427";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE INDEX "IDX_photos_album_id" ON "photos" ("album_id") `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_photos_album_id"`);
	}
}
