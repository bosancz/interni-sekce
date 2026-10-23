import { MigrationInterface, QueryRunner } from "typeorm";

export class GroupMeetingDayAndLeader1792751227417 implements MigrationInterface {
	name = "GroupMeetingDayAndLeader1792751227417";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."groups_meeting_day_enum" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday')`,
		);
		await queryRunner.query(`ALTER TABLE "groups" ADD "meeting_day" "public"."groups_meeting_day_enum"`);
		await queryRunner.query(`ALTER TABLE "groups" ADD "leader_id" integer`);
		await queryRunner.query(
			`ALTER TABLE "groups" ADD CONSTRAINT "FK_fdb67d577cb1623e0d11a3fa6b0" FOREIGN KEY ("leader_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
		);
		await queryRunner.query(`
            UPDATE "groups" g
            SET "meeting_day" = d.day::"public"."groups_meeting_day_enum",
                "leader_id" = (
                    SELECT min(m.id) FROM "members" m
                    WHERE m.deleted_at IS NULL AND lower(m.nickname) = lower(d.nickname)
                    HAVING count(*) = 1
                )
            FROM (VALUES
                ('3', 'wednesday', 'Čip'),
                ('4', 'wednesday', 'Ředkvička'),
                ('5', 'monday', 'Johanka'),
                ('6', 'wednesday', 'Rammstein'),
                ('7', 'monday', 'Kšilt'),
                ('8', 'monday', 'Číča'),
                ('22', 'monday', 'Lef')
            ) AS d(short_name, day, nickname)
            WHERE g.short_name = d.short_name
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "FK_fdb67d577cb1623e0d11a3fa6b0"`);
		await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "leader_id"`);
		await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "meeting_day"`);
		await queryRunner.query(`DROP TYPE "public"."groups_meeting_day_enum"`);
	}
}
