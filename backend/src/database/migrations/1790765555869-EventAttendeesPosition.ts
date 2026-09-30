import { MigrationInterface, QueryRunner } from "typeorm";

export class EventAttendeesPosition1790765555869 implements MigrationInterface {
	name = "EventAttendeesPosition1790765555869";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events_attendees" ADD "position" integer`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events_attendees" DROP COLUMN "position"`);
	}
}
