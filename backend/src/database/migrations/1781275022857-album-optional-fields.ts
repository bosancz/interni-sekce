import { MigrationInterface, QueryRunner } from "typeorm";

export class AlbumOptionalFields1781275022857 implements MigrationInterface {
	name = "AlbumOptionalFields1781275022857";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "albums" ALTER COLUMN "description" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "albums" ALTER COLUMN "date_published" DROP NOT NULL`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`UPDATE "albums" SET "description" = '' WHERE "description" IS NULL`);
		await queryRunner.query(`UPDATE "albums" SET "date_published" = now() WHERE "date_published" IS NULL`);

		await queryRunner.query(`ALTER TABLE "albums" ALTER COLUMN "description" SET NOT NULL`);
		await queryRunner.query(`ALTER TABLE "albums" ALTER COLUMN "date_published" SET NOT NULL`);
	}
}
