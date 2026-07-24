import { MigrationInterface, QueryRunner } from "typeorm";

export class SearchStringColumns1784914934807 implements MigrationInterface {
    name = 'SearchStringColumns1784914934807'

    // Generated columns are tracked by TypeORM in the `typeorm_metadata` table; without a matching
    // row there, every future `migrations:generate` would try to drop and recreate the column. The
    // ADD COLUMN statements below are therefore paired with typeorm_metadata rows in the exact shape
    // the generator emits — except the `database` value uses current_database() instead of a
    // hardcoded name, so the migration matches whatever DB it runs against (dev vs. production).
    private readonly columns = [
        { table: "members", expression: "immutable_unaccent(coalesce(nickname, '') || ' ' || coalesce(first_name, '') || ' ' || coalesce(last_name, ''))" },
        { table: "events", expression: "immutable_unaccent(coalesce(name, ''))" },
        { table: "albums", expression: "immutable_unaccent(coalesce(name, ''))" },
        { table: "users", expression: "immutable_unaccent(coalesce(login, ''))" },
    ];

    public async up(queryRunner: QueryRunner): Promise<void> {
        // The `unaccent` extension and the immutable wrapper below have no entity representation,
        // so TypeORM cannot generate them — they are added by hand ahead of the generated columns
        // that depend on them (see the natural_numeric collation migration for the same pattern).
        //
        // Postgres' built-in unaccent() is only STABLE, and a stored GENERATED column requires an
        // IMMUTABLE expression. Pinning the dictionary lets us wrap it in an IMMUTABLE function that
        // the generated columns can use.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "unaccent"`);
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION immutable_unaccent(text)
            RETURNS text
            LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
            AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$
        `);

        for (const { table, expression } of this.columns) {
            await queryRunner.query(`ALTER TABLE "${table}" ADD "search_string" text GENERATED ALWAYS AS (${expression}) STORED`);
            await queryRunner.query(
                `INSERT INTO "public"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (current_database(), $1, $2, $3, $4, $5)`,
                ["public", table, "GENERATED_COLUMN", "search_string", expression],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const { table } of [...this.columns].reverse()) {
            await queryRunner.query(
                `DELETE FROM "public"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = current_database() AND "schema" = $3 AND "table" = $4`,
                ["GENERATED_COLUMN", "search_string", "public", table],
            );
            await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "search_string"`);
        }

        await queryRunner.query(`DROP FUNCTION IF EXISTS immutable_unaccent(text)`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS "unaccent"`);
    }

}
