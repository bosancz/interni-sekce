import { MigrationInterface, QueryRunner } from "typeorm";

export class BackupRunsFilesPurged1795882016664 implements MigrationInterface {
	name = "BackupRunsFilesPurged1795882016664";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "backup_runs" ADD "files_purged" integer`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "backup_runs" DROP COLUMN "files_purged"`);
	}
}
