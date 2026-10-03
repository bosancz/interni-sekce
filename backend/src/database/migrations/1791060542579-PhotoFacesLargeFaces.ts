import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotoFacesLargeFaces1791060542579 implements MigrationInterface {
	name = "PhotoFacesLargeFaces1791060542579";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`UPDATE "photos" SET "faces_detected_at" = NULL, "faces_error" = NULL WHERE "faces_detected_at" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "photo_faces" WHERE "photo_faces"."photo_id" = "photos"."id")`,
		);
	}

	public async down(): Promise<void> {}
}
