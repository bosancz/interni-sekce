import { MigrationInterface, QueryRunner } from "typeorm";

export class eventSoftDelete1671631678040 implements MigrationInterface {
    name = 'eventSoftDelete1671631678040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "deleted_at"`);
    }

}
