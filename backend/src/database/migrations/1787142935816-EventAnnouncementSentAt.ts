import { MigrationInterface, QueryRunner } from "typeorm";

export class EventAnnouncementSentAt1787142935816 implements MigrationInterface {
	name = "EventAnnouncementSentAt1787142935816";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" ADD "announcement_sent_at" TIMESTAMP WITH TIME ZONE`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "announcement_sent_at"`);
	}
}
