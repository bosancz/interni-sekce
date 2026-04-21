import { MigrationInterface, QueryRunner } from "typeorm";

export class ExpenseFieldsOptional1762167593384 implements MigrationInterface {
	name = "ExpenseFieldsOptional1762167593384";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events_expenses" ALTER COLUMN "receipt_number" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "events_expenses" ALTER COLUMN "amount" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "events_expenses" ALTER COLUMN "type" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "events_expenses" ALTER COLUMN "description" DROP NOT NULL`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`UPDATE "events_expenses" SET "description" = '' WHERE "description" IS NULL`);
		await queryRunner.query(`UPDATE "events_expenses" SET "type" = 'other' WHERE "type" IS NULL`);
		await queryRunner.query(`UPDATE "events_expenses" SET "amount" = 0 WHERE "amount" IS NULL`);
		await queryRunner.query(`UPDATE "events_expenses" SET "receipt_number" = '' WHERE "receipt_number" IS NULL`);

		await queryRunner.query(`ALTER TABLE "events_expenses" ALTER COLUMN "description" SET NOT NULL`);
		await queryRunner.query(`ALTER TABLE "events_expenses" ALTER COLUMN "type" SET NOT NULL`);
		await queryRunner.query(`ALTER TABLE "events_expenses" ALTER COLUMN "amount" SET NOT NULL`);
		await queryRunner.query(`ALTER TABLE "events_expenses" ALTER COLUMN "receipt_number" SET NOT NULL`);
	}
}
