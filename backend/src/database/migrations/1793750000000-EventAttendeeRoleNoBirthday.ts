import { MigrationInterface, QueryRunner } from "typeorm";

export class EventAttendeeRoleNoBirthday1793750000000 implements MigrationInterface {
	name = "EventAttendeeRoleNoBirthday1793750000000";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            UPDATE "events_attendees" ea
            SET "role" = 'dite'
            FROM "members" m
            WHERE m.id = ea.member_id
                AND m.birthday IS NULL
                AND ea.type = 'attendee'
                AND ea.role <> 'dite'
        `);
	}

	public async down(): Promise<void> {}
}
