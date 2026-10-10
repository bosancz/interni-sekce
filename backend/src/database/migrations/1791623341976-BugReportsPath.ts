import { MigrationInterface, QueryRunner } from "typeorm";

export class BugReportsPath1791623341976 implements MigrationInterface {
    name = 'BugReportsPath1791623341976'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bug_reports" ADD "path" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bug_reports" DROP COLUMN "path"`);
    }

}
