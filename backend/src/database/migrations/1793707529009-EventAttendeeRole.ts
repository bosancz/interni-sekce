import { MigrationInterface, QueryRunner } from "typeorm";

export class EventAttendeeRole1793707529009 implements MigrationInterface {
	name = "EventAttendeeRole1793707529009";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."events_attendees_role_enum" AS ENUM('dite', 'instruktor', 'vedouci')`,
		);
		await queryRunner.query(`ALTER TABLE "events_attendees" ADD "role" "public"."events_attendees_role_enum"`);
		await queryRunner.query(`
            UPDATE "events_attendees" ea
            SET "role" = (CASE
                WHEN m.birthday IS NULL THEN m.role::text
                WHEN date_part('year', age(e.date_from, m.birthday)) >= 18 THEN 'vedouci'
                WHEN date_part('year', age(e.date_from, m.birthday)) >= 15 THEN 'instruktor'
                ELSE 'dite'
            END)::"public"."events_attendees_role_enum"
            FROM "members" m, "events" e
            WHERE m.id = ea.member_id AND e.id = ea.event_id
        `);
		await queryRunner.query(`ALTER TABLE "events_attendees" ALTER COLUMN "role" SET NOT NULL`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events_attendees" DROP COLUMN "role"`);
		await queryRunner.query(`DROP TYPE "public"."events_attendees_role_enum"`);
	}
}
