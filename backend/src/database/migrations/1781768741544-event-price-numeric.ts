import { MigrationInterface, QueryRunner } from "typeorm";

export class EventPriceNumeric1781768741544 implements MigrationInterface {
	name = "EventPriceNumeric1781768741544";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "events" ALTER COLUMN "price" TYPE integer USING NULLIF(regexp_replace("price", '[^0-9]', '', 'g'), '')::integer`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "price" TYPE text`);
	}
}
