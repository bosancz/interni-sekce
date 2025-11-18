import { MigrationInterface, QueryRunner } from "typeorm";

export class eventExpenseTypeEnum1682264978418 implements MigrationInterface {
	name = "eventExpenseTypeEnum1682264978418";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events_expenses" DROP COLUMN "type"`);
		await queryRunner.query(
			`CREATE TYPE "public"."events_expenses_type_enum" AS ENUM('food', 'transport', 'material', 'accommodation', 'other')`,
		);
		await queryRunner.query(
			`ALTER TABLE "events_expenses" ADD "type" "public"."events_expenses_type_enum" NOT NULL`,
		);
		await queryRunner.query(`ALTER TYPE "public"."events_status_enum" RENAME TO "events_status_enum_old"`);
		await queryRunner.query(
			`CREATE TYPE "public"."events_status_enum" AS ENUM('draft', 'pending', 'public', 'cancelled')`,
		);
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" DROP DEFAULT`);
		await queryRunner.query(
			`ALTER TABLE "events" ALTER COLUMN "status" TYPE "public"."events_status_enum" USING "status"::"text"::"public"."events_status_enum"`,
		);
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" SET DEFAULT 'draft'`);
		await queryRunner.query(`DROP TYPE "public"."events_status_enum_old"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."events_status_enum_old" AS ENUM('draft', 'pending', 'public', 'cancelled', 'rejected')`,
		);
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" DROP DEFAULT`);
		await queryRunner.query(
			`ALTER TABLE "events" ALTER COLUMN "status" TYPE "public"."events_status_enum_old" USING "status"::"text"::"public"."events_status_enum_old"`,
		);
		await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" SET DEFAULT 'draft'`);
		await queryRunner.query(`DROP TYPE "public"."events_status_enum"`);
		await queryRunner.query(`ALTER TYPE "public"."events_status_enum_old" RENAME TO "events_status_enum"`);
		await queryRunner.query(`ALTER TABLE "events_expenses" DROP COLUMN "type"`);
		await queryRunner.query(`DROP TYPE "public"."events_expenses_type_enum"`);
		await queryRunner.query(`ALTER TABLE "events_expenses" ADD "type" character varying NOT NULL`);
	}
}
