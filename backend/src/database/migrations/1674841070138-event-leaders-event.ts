import { MigrationInterface, QueryRunner } from "typeorm";

export class eventLeadersEvent1674841070138 implements MigrationInterface {
    name = 'eventLeadersEvent1674841070138'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ADD "leaders_event" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "leaders_event"`);
    }

}
