import { MigrationInterface, QueryRunner } from "typeorm";

export class EventPublishedCancelledAt1792780467178 implements MigrationInterface {
	name = "EventPublishedCancelledAt1792780467178";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" ADD "published_at" TIMESTAMP WITH TIME ZONE`);
		await queryRunner.query(`ALTER TABLE "events" ADD "cancelled_at" TIMESTAMP WITH TIME ZONE`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "cancelled_at"`);
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "published_at"`);
	}
}
