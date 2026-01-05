import { MigrationInterface, QueryRunner } from "typeorm";

export class eventHasRegistration1764274122157 implements MigrationInterface {
    name = 'eventHasRegistration1764274122157'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ADD "has_registration" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "has_registration"`);
    }

}
