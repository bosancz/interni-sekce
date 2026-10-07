import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotoEmbeddingsCrops1791466679943 implements MigrationInterface {
	name = "PhotoEmbeddingsCrops1791466679943";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DELETE FROM "photo_embeddings"`);
		await queryRunner.query(`ALTER TABLE "photo_embeddings" ADD "crop" smallint NOT NULL DEFAULT '0'`);
		await queryRunner.query(`ALTER TABLE "photo_embeddings" DROP CONSTRAINT "PK_9855448b798be304e8e57340a4c"`);
		await queryRunner.query(
			`ALTER TABLE "photo_embeddings" ADD CONSTRAINT "PK_ba8e9bcdb0a7cec091656085e1c" PRIMARY KEY ("photo_id", "crop")`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DELETE FROM "photo_embeddings"`);
		await queryRunner.query(`ALTER TABLE "photo_embeddings" DROP CONSTRAINT "PK_ba8e9bcdb0a7cec091656085e1c"`);
		await queryRunner.query(
			`ALTER TABLE "photo_embeddings" ADD CONSTRAINT "PK_9855448b798be304e8e57340a4c" PRIMARY KEY ("photo_id")`,
		);
		await queryRunner.query(`ALTER TABLE "photo_embeddings" DROP COLUMN "crop"`);
	}
}
