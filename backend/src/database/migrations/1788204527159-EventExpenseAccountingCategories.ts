import { MigrationInterface, QueryRunner } from "typeorm";

export class EventExpenseAccountingCategories1788204527159 implements MigrationInterface {
	name = "EventExpenseAccountingCategories1788204527159";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE "public"."events_expenses_type_enum" RENAME TO "events_expenses_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."events_expenses_type_enum" AS ENUM('travelAllowance', 'transport', 'material', 'other', 'fuel', 'food', 'catering', 'accommodation', 'admission')`,
		);
		await queryRunner.query(
			`ALTER TABLE "events_expenses" ALTER COLUMN "type" TYPE "public"."events_expenses_type_enum" USING "type"::"text"::"public"."events_expenses_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."events_expenses_type_enum_old"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."events_expenses_type_enum_old" AS ENUM('food', 'transport', 'material', 'accommodation', 'other')`,
		);
		// The new categories have no counterpart in the old enum, so the cast below would fail on any
		// receipt already using one. Fold them into the closest old category first (lossy, but a revert
		// of a category split always is).
		await queryRunner.query(
			`UPDATE "events_expenses" SET "type" = 'transport' WHERE "type" IN ('travelAllowance', 'fuel')`,
		);
		await queryRunner.query(`UPDATE "events_expenses" SET "type" = 'food' WHERE "type" = 'catering'`);
		await queryRunner.query(`UPDATE "events_expenses" SET "type" = 'other' WHERE "type" = 'admission'`);
		await queryRunner.query(
			`ALTER TABLE "events_expenses" ALTER COLUMN "type" TYPE "public"."events_expenses_type_enum_old" USING "type"::"text"::"public"."events_expenses_type_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."events_expenses_type_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."events_expenses_type_enum_old" RENAME TO "events_expenses_type_enum"`,
		);
	}
}
