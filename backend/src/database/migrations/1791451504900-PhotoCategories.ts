import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotoCategories1791451504900 implements MigrationInterface {
	name = "PhotoCategories1791451504900";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "photo_categories" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "prompts" text array NOT NULL DEFAULT '{}', "threshold" real NOT NULL DEFAULT '0.25', "order" integer, "embedding" bytea, "model" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_09d68e3eb1565cf09391ec7b0a6" UNIQUE ("name"), CONSTRAINT "PK_4dd17d1307876530bc420e0da8d" PRIMARY KEY ("id"))`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "photo_categories"`);
	}
}
