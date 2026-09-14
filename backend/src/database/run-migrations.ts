import { Logger } from "@nestjs/common";
import { DataSource, MigrationExecutor } from "typeorm";
import { Config } from "../config";

export async function runMigrations(config: Config) {
	const logger = new Logger("Migrations");
	logger.log("Running migrations...");

	const dataSource = new DataSource(config.db);
	await dataSource.initialize();

	const queryRunner = dataSource.createQueryRunner();

	await queryRunner.startTransaction();

	const schema = "schema" in config.db ? config.db.schema : undefined;
	await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS ${schema ?? "public"}`);

	const migrationExecutor = new MigrationExecutor(dataSource, queryRunner);
	migrationExecutor.transaction = "none";

	await migrationExecutor["createMigrationsTableIfNotExist"](queryRunner);

	await queryRunner.query(`LOCK TABLE ${migrationExecutor["migrationsTable"]} IN ACCESS EXCLUSIVE MODE`);

	const result = await migrationExecutor.executePendingMigrations();

	await queryRunner.commitTransaction();

	await queryRunner.release();
	await dataSource.destroy();

	logger.log(`Migrations complete. Executed ${result.length} migrations.`);

	return result;
}
