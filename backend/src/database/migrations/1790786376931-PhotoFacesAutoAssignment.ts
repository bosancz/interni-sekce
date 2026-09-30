import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotoFacesAutoAssignment1790786376931 implements MigrationInterface {
	name = "PhotoFacesAutoAssignment1790786376931";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "assignment" character varying`);
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "match_score" real`);
		await queryRunner.query(`UPDATE "photo_faces" SET "assignment" = 'manual' WHERE "member_id" IS NOT NULL`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`UPDATE "photo_faces" SET "member_id" = NULL, "assigned_at" = NULL, "assigned_by_id" = NULL WHERE "assignment" = 'auto'`,
		);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "match_score"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "assignment"`);
	}
}
