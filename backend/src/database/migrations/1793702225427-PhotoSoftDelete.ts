import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotoSoftDelete1793702225427 implements MigrationInterface {
	name = "PhotoSoftDelete1793702225427";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photos" ADD "deleted_at" TIMESTAMP`);
		await queryRunner.query(`ALTER TABLE "photos" ADD "deleted_by_id" integer`);
		await queryRunner.query(
			`ALTER TABLE "photos" ADD CONSTRAINT "FK_7beab06fac17d2762808e5ecaa4" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photos" DROP CONSTRAINT "FK_7beab06fac17d2762808e5ecaa4"`);
		await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "deleted_by_id"`);
		await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "deleted_at"`);
	}
}
