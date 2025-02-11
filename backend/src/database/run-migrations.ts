import { Logger } from "@nestjs/common";
import { DataSource, MigrationExecutor } from "typeorm";
import { Config } from "../config";

export async function runMigrations(config: Config) {
	const logger = new Logger("Migrations");
	logger.log("Running migrations...");

	// connect to the database
	const dataSource = new DataSource(config.db);
	await dataSource.initialize();

	const queryRunner = dataSource.createQueryRunner();

	// start
	await queryRunner.startTransaction();

	// create schema if it doesn't exist
	await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS ${config.db.schema ?? "public"}`);

	// create migration executor
	const migrationExecutor = new MigrationExecutor(dataSource, queryRunner);
	migrationExecutor.transaction = "none"; // we are already in a transaction

	// create migrations table if it doesn't exist, prevents error on first run
	// createMigrationsTableIfNotExist is a protected method, so we use bracket notation
	await migrationExecutor["createMigrationsTableIfNotExist"](queryRunner);

	// prevent other instances from running migrations at the same time
	await queryRunner.query(`LOCK TABLE ${migrationExecutor["migrationsTable"]} IN ACCESS EXCLUSIVE MODE`);

	// run migrations
	const result = await migrationExecutor.executePendingMigrations();

	// commit
	await queryRunner.commitTransaction();

	// finish
	await queryRunner.release();
	await dataSource.destroy();

	logger.log(`Migrations complete. Executed ${result.length} migrations.`);

	return result;
}
