import { MigrationInterface, QueryRunner } from "typeorm";

export class eventAttendeesDeleteCascade1674747565172 implements MigrationInterface {
    name = 'eventAttendeesDeleteCascade1674747565172'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events_attendees" DROP CONSTRAINT "FK_66d88c4938cd79dac741ddf846d"`);
        await queryRunner.query(`ALTER TABLE "events_attendees" DROP CONSTRAINT "FK_370541e98297da9d2055977a2b2"`);
        await queryRunner.query(`ALTER TABLE "events_attendees" ADD CONSTRAINT "FK_370541e98297da9d2055977a2b2" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_attendees" ADD CONSTRAINT "FK_66d88c4938cd79dac741ddf846d" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events_attendees" DROP CONSTRAINT "FK_66d88c4938cd79dac741ddf846d"`);
        await queryRunner.query(`ALTER TABLE "events_attendees" DROP CONSTRAINT "FK_370541e98297da9d2055977a2b2"`);
        await queryRunner.query(`ALTER TABLE "events_attendees" ADD CONSTRAINT "FK_370541e98297da9d2055977a2b2" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_attendees" ADD CONSTRAINT "FK_66d88c4938cd79dac741ddf846d" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    }

}
