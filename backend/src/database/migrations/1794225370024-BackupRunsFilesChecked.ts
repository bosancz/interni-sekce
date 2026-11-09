import { MigrationInterface, QueryRunner } from "typeorm";

export class BackupRunsFilesChecked1794225370024 implements MigrationInterface {
	name = "BackupRunsFilesChecked1794225370024";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "backup_runs" ADD "files_checked" integer`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "backup_runs" DROP COLUMN "files_checked"`);
	}
}
