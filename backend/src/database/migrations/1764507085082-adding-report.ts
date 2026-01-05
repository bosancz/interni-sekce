import { MigrationInterface, QueryRunner } from "typeorm";

export class addingReport1764507085082 implements MigrationInterface {
    name = 'addingReport1764507085082'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ADD "report" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "report"`);
    }

}
