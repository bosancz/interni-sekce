import { MigrationInterface, QueryRunner } from "typeorm";

export class EventAccountingSentAt1787144625932 implements MigrationInterface {
	name = "EventAccountingSentAt1787144625932";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" ADD "accounting_sent_at" TIMESTAMP WITH TIME ZONE`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "accounting_sent_at"`);
	}
}
