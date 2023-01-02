import { MigrationInterface, QueryRunner } from "typeorm";

export class membersGroupNameStatus1672673998736 implements MigrationInterface {
    name = 'membersGroupNameStatus1672673998736'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" ADD "active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "name" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "active"`);
    }

}
