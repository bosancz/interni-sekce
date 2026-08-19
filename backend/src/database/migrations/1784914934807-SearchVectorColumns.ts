import { MigrationInterface, QueryRunner } from "typeorm";

export class SearchVectorColumns1784914934807 implements MigrationInterface {
    name = 'SearchVectorColumns1784914934807'

    private readonly columns = [
        { table: "members", expression: "to_tsvector('simple_unaccent', coalesce(nickname, '') || ' ' || coalesce(first_name, '') || ' ' || coalesce(last_name, ''))" },
        { table: "events", expression: "to_tsvector('simple_unaccent', coalesce(name, ''))" },
        { table: "albums", expression: "to_tsvector('simple_unaccent', coalesce(name, ''))" },
        { table: "users", expression: "to_tsvector('simple_unaccent', coalesce(login, ''))" },
    ];

    private indexName(table: string): string {
        return `IDX_${table}_search_vector`;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "unaccent"`);
        await queryRunner.query(`CREATE TEXT SEARCH CONFIGURATION "simple_unaccent" (COPY = "simple")`);
        await queryRunner.query(`
            ALTER TEXT SEARCH CONFIGURATION "simple_unaccent"
            ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part
            WITH unaccent, simple
        `);

        for (const { table, expression } of this.columns) {
            await queryRunner.query(`ALTER TABLE "${table}" ADD "search_vector" tsvector GENERATED ALWAYS AS (${expression}) STORED`);
            await queryRunner.query(
                `INSERT INTO "public"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (current_database(), $1, $2, $3, $4, $5)`,
                ["public", table, "GENERATED_COLUMN", "search_vector", expression],
            );
            await queryRunner.query(`CREATE INDEX "${this.indexName(table)}" ON "${table}" USING gin ("search_vector")`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const { table } of [...this.columns].reverse()) {
            await queryRunner.query(`DROP INDEX IF EXISTS "public"."${this.indexName(table)}"`);
            await queryRunner.query(
                `DELETE FROM "public"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = current_database() AND "schema" = $3 AND "table" = $4`,
                ["GENERATED_COLUMN", "search_vector", "public", table],
            );
            await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "search_vector"`);
        }

        await queryRunner.query(`DROP TEXT SEARCH CONFIGURATION IF EXISTS "simple_unaccent"`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS "unaccent"`);
    }

}
