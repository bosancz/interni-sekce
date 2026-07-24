import { MigrationInterface, QueryRunner } from "typeorm";

export class SearchStringColumns1784914934807 implements MigrationInterface {
    name = 'SearchStringColumns1784914934807'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // The `unaccent` extension and the immutable wrapper below have no entity
        // representation, so TypeORM cannot generate them — they are added by hand
        // ahead of the generated columns that depend on them (see the natural_numeric
        // collation migration for the same pattern).
        //
        // Postgres' built-in unaccent() is only STABLE, and a stored GENERATED column
        // requires an IMMUTABLE expression. Pinning the dictionary lets us wrap it in an
        // IMMUTABLE function that the generated columns can use.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "unaccent"`);
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION immutable_unaccent(text)
            RETURNS text
            LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
            AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$
        `);

        await queryRunner.query(`ALTER TABLE "members" ADD "search_string" text GENERATED ALWAYS AS (immutable_unaccent(coalesce(nickname, '') || ' ' || coalesce(first_name, '') || ' ' || coalesce(last_name, ''))) STORED`);
        await queryRunner.query(`ALTER TABLE "events" ADD "search_string" text GENERATED ALWAYS AS (immutable_unaccent(coalesce(name, ''))) STORED`);
        await queryRunner.query(`ALTER TABLE "albums" ADD "search_string" text GENERATED ALWAYS AS (immutable_unaccent(coalesce(name, ''))) STORED`);
        await queryRunner.query(`ALTER TABLE "users" ADD "search_string" text GENERATED ALWAYS AS (immutable_unaccent(coalesce(login, ''))) STORED`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "search_string"`);
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "search_string"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "search_string"`);
        await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "search_string"`);

        await queryRunner.query(`DROP FUNCTION IF EXISTS immutable_unaccent(text)`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS "unaccent"`);
    }

}
