import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotoFacesMatchCandidate1790842451467 implements MigrationInterface {
	name = "PhotoFacesMatchCandidate1790842451467";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "candidate_member_id" integer`);
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "candidate_score" real`);
		await queryRunner.query(`ALTER TABLE "photo_faces" ADD "candidate_second_score" real`);
		await queryRunner.query(
			`ALTER TABLE "photo_faces" ADD CONSTRAINT "FK_9af19453b25c6ca3782cf120077" FOREIGN KEY ("candidate_member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP CONSTRAINT "FK_9af19453b25c6ca3782cf120077"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "candidate_second_score"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "candidate_score"`);
		await queryRunner.query(`ALTER TABLE "photo_faces" DROP COLUMN "candidate_member_id"`);
	}
}
