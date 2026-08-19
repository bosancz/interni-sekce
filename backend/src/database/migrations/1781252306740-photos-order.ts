import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotosOrder1781252306740 implements MigrationInterface {
	name = "PhotosOrder1781252306740";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photos" ADD "order" integer`);

		await queryRunner.query(`
			UPDATE "photos" p
			SET "order" = sub.rn
			FROM (
				SELECT id, row_number() OVER (PARTITION BY album_id ORDER BY timestamp ASC, id ASC) AS rn
				FROM "photos"
			) sub
			WHERE p.id = sub.id
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "order"`);
	}
}
