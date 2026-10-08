import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotoEmbeddings1791381778459 implements MigrationInterface {
	name = "PhotoEmbeddings1791381778459";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "photo_embeddings" ("photo_id" integer NOT NULL, "embedding" bytea, "model" character varying, "error" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9855448b798be304e8e57340a4c" PRIMARY KEY ("photo_id"))`,
		);
		await queryRunner.query(
			`ALTER TABLE "photo_embeddings" ADD CONSTRAINT "FK_9855448b798be304e8e57340a4c" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photo_embeddings" DROP CONSTRAINT "FK_9855448b798be304e8e57340a4c"`);
		await queryRunner.query(`DROP TABLE "photo_embeddings"`);
	}
}
