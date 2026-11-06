import { MigrationInterface, QueryRunner } from "typeorm";

export class BackupRunsWarnings1793960104957 implements MigrationInterface {
	name = "BackupRunsWarnings1793960104957";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "backup_runs" ADD "warnings" text`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "backup_runs" DROP COLUMN "warnings"`);
	}
}
