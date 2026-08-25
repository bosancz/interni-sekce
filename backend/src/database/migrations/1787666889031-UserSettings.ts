import { MigrationInterface, QueryRunner } from "typeorm";

export class UserSettings1787666889031 implements MigrationInterface {
    name = 'UserSettings1787666889031'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "settings" jsonb NOT NULL DEFAULT '{}'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "settings"`);
    }

}
