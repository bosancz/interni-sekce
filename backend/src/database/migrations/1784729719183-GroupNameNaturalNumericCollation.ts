import { MigrationInterface, QueryRunner } from "typeorm";

export class GroupNameNaturalNumericCollation1784729719183 implements MigrationInterface {
	name = "GroupNameNaturalNumericCollation1784729719183";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE COLLATION IF NOT EXISTS "natural_numeric" (provider = icu, locale = 'en-u-kn-true')`,
		);
		await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "name" TYPE text COLLATE "natural_numeric"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "name" TYPE text COLLATE pg_catalog."default"`);
		await queryRunner.query(`DROP COLLATION IF EXISTS "natural_numeric"`);
	}
}
