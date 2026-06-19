import { MigrationInterface, QueryRunner } from "typeorm";

export class EventPriceItemList1781766300442 implements MigrationInterface {
	name = "EventPriceItemList1781766300442";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" ADD "price" text`);
		await queryRunner.query(`ALTER TABLE "events" ADD "item_list" text`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "item_list"`);
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "price"`);
	}
}
