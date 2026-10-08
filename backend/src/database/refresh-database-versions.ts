import { Logger } from "@nestjs/common";
import { DataSource } from "typeorm";
import { Config } from "../config";

export interface DatabaseVersionsRefresh {
	reindexed: boolean;
	collations: string[];
	extensions: { name: string; from: string; to: string }[];
}

export async function refreshDatabaseVersions(config: Config): Promise<DatabaseVersionsRefresh> {
	const logger = new Logger("DatabaseVersions");

	const dataSource = new DataSource({ ...config.db, migrationsRun: false });
	await dataSource.initialize();

	try {
		const result: DatabaseVersionsRefresh = { reindexed: false, collations: [], extensions: [] };

		const [database]: { name: string; stale: boolean }[] = await dataSource.query(
			`SELECT datname AS "name",
				datcollversion IS DISTINCT FROM pg_database_collation_actual_version(oid) AS "stale"
			FROM pg_database WHERE datname = current_database()`,
		);
		const collations: { name: string }[] = await dataSource.query(
			`SELECT oid::regcollation::text AS "name" FROM pg_collation
			WHERE collnamespace <> 'pg_catalog'::regnamespace AND collversion IS NOT NULL
				AND collversion IS DISTINCT FROM pg_collation_actual_version(oid)`,
		);

		if (database.stale || collations.length) {
			logger.warn(
				`Collation versions changed (database: ${database.stale}, collations: ${collations.map((c) => c.name).join(", ") || "-"}), reindexing database "${database.name}"...`,
			);
			const started = Date.now();
			await dataSource.query(`REINDEX DATABASE "${database.name}"`);
			for (const collation of collations)
				await dataSource.query(`ALTER COLLATION ${collation.name} REFRESH VERSION`);
			if (database.stale) await dataSource.query(`ALTER DATABASE "${database.name}" REFRESH COLLATION VERSION`);

			result.reindexed = true;
			result.collations = collations.map((collation) => collation.name);
			logger.log(`Reindexed database "${database.name}" in ${Date.now() - started} ms.`);
		}

		const extensions: { name: string; from: string; to: string }[] = await dataSource.query(
			`SELECT e.extname AS "name", e.extversion AS "from", a.default_version AS "to"
			FROM pg_extension e JOIN pg_available_extensions a ON a.name = e.extname
			WHERE e.extversion IS DISTINCT FROM a.default_version
			ORDER BY e.oid`,
		);
		for (const extension of extensions) {
			logger.warn(`Updating extension ${extension.name} from ${extension.from} to ${extension.to}...`);
			await dataSource.query(`ALTER EXTENSION "${extension.name}" UPDATE`);
		}
		result.extensions = extensions;

		return result;
	} finally {
		await dataSource.destroy();
	}
}
