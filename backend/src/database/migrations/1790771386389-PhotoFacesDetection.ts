import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotoFacesDetection1790771386389 implements MigrationInterface {
	name = "PhotoFacesDetection1790771386389";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DELETE FROM "photo_faces"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP CONSTRAINT "FK_ad00f96563219eb5a9a507f70d8"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "location"`);
		await queryRunner.query(`ALTER TABLE "photos" ADD "faces_detected_at" TIMESTAMP WITH TIME ZONE`);
		await queryRunner.query(`ALTER TABLE "photos" ADD "faces_model" character varying`);
		await queryRunner.query(`ALTER TABLE "photos" ADD "faces_error" character varying`);
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "x" real NOT NULL`);
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "y" real NOT NULL`);
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "width" real NOT NULL`);
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "height" real NOT NULL`);
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "score" real`);
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "model" character varying`);
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "assigned_by_id" integer`);
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "assigned_at" TIMESTAMP WITH TIME ZONE`);
		await queryRunner.query(`ALTER TABLE "members" ADD "profile_photo_face_id" integer`);
		await queryRunner.query(`ALTER TABLE "members" ADD "profile_photo_updated_at" TIMESTAMP WITH TIME ZONE`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "descriptor"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "descriptor" real array`);
		await queryRunner.query(
			`CREATE INDEX "IDX_photos_faces_pending" ON "photos" ("timestamp", "id") WHERE faces_detected_at IS NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "photo_faces" ADD CONSTRAINT "FK_ad00f96563219eb5a9a507f70d8" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "photo_faces" ADD CONSTRAINT "FK_7ff046aee7ca30a57d97bf65fff" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "members" ADD CONSTRAINT "FK_e8f2c3e5f9466588a5ad197868d" FOREIGN KEY ("profile_photo_face_id") REFERENCES "photo_faces"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "members" DROP CONSTRAINT "FK_e8f2c3e5f9466588a5ad197868d"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP CONSTRAINT "FK_7ff046aee7ca30a57d97bf65fff"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP CONSTRAINT "FK_ad00f96563219eb5a9a507f70d8"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_photos_faces_pending"`);
		await queryRunner.query(`UPDATE "members" SET "profile_photo_face_id" = NULL`);
		await queryRunner.query(`DELETE FROM "photo_faces"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "descriptor"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "descriptor" cube NOT NULL`);
		await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "profile_photo_updated_at"`);
		await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "profile_photo_face_id"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "assigned_at"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "assigned_by_id"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "model"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "score"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "height"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "width"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "y"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "x"`);
		await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "faces_error"`);
		await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "faces_model"`);
		await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "faces_detected_at"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "location" integer array NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "photo_faces" ADD CONSTRAINT "FK_ad00f96563219eb5a9a507f70d8" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
		);
	}
}
