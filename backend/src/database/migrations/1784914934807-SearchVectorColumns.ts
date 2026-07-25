import { MigrationInterface, QueryRunner } from "typeorm";

export class SearchVectorColumns1784914934807 implements MigrationInterface {
    name = 'SearchVectorColumns1784914934807'

    // Each searchable entity gets a stored `search_vector` tsvector, built with the `simple_unaccent`
    // text-search configuration so search is diacritic- and case-insensitive. `to_tsvector(regconfig,
    // text)` is IMMUTABLE (unlike the STABLE built-in unaccent()), so it can be used directly in a
    // STORED generated column. Each column is tracked in `typeorm_metadata` in the shape the generator
    // expects — with current_database() instead of a hardcoded name, so it matches in dev and prod —
    // otherwise every later `migrations:generate` would try to drop and recreate the column.
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
        // The `unaccent` extension and the `simple_unaccent` configuration have no entity
        // representation, so TypeORM cannot generate them — they are created by hand ahead of the
        // generated columns that reference the config (see the natural_numeric collation migration
        // for the same pattern). The config copies `simple` (lowercase, no stemming/stopwords) and
        // remaps its word tokens through `unaccent` so accents are folded away.
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
            // GIN index for `@@` full-text matching. Declared on the entity with synchronize:false
            // (TypeORM cannot express `USING gin`), so it is created and dropped here by hand.
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
