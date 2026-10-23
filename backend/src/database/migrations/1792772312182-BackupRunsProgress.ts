import { MigrationInterface, QueryRunner } from "typeorm";

export class BackupRunsProgress1792772312182 implements MigrationInterface {
	name = "BackupRunsProgress1792772312182";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "backup_runs" ADD "progress" jsonb`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "backup_runs" DROP COLUMN "progress"`);
	}
}
