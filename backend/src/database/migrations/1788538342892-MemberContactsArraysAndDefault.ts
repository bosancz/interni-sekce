import { MigrationInterface, QueryRunner } from "typeorm";

export class MemberContactsArraysAndDefault1788538342892 implements MigrationInterface {
	name = "MemberContactsArraysAndDefault1788538342892";

	private readonly expression =
		"to_tsvector('simple_unaccent', coalesce(name, '') || ' ' || regexp_replace(regexp_replace(immutable_array_to_string(mobile, ', '), '(?<=[[:digit:]])[[:space:]-]+(?=[[:digit:]])', '', 'g'), '([+]|00)420', '', 'g') || ' ' || translate(immutable_array_to_string(email, ', '), '@._+-', '     '))";

	private readonly previousExpression =
		"to_tsvector('simple_unaccent', coalesce(name, '') || ' ' || regexp_replace(regexp_replace(coalesce(mobile, ''), '(?<=[[:digit:]])[[:space:]-]+(?=[[:digit:]])', '', 'g'), '([+]|00)420', '', 'g') || ' ' || translate(coalesce(email, ''), '@._+-', '     '))";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE OR REPLACE FUNCTION immutable_array_to_string(text[], text) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$ SELECT coalesce(array_to_string($1, $2), '') $$`,
		);

		await this.dropSearchVector(queryRunner);

		for (const column of ["mobile", "email"]) {
			await queryRunner.query(
				`ALTER TABLE "members_contacts" ALTER COLUMN "${column}" TYPE character varying array USING (CASE WHEN btrim(coalesce("${column}", '')) = '' THEN '{}'::character varying[] ELSE ARRAY["${column}"] END)`,
			);
			await queryRunner.query(`ALTER TABLE "members_contacts" ALTER COLUMN "${column}" SET DEFAULT '{}'`);
			await queryRunner.query(`ALTER TABLE "members_contacts" ALTER COLUMN "${column}" SET NOT NULL`);
		}

		await queryRunner.query(`ALTER TABLE "members_contacts" ADD "is_default" boolean NOT NULL DEFAULT false`);

		await this.addSearchVector(queryRunner, this.expression);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await this.dropSearchVector(queryRunner);

		await queryRunner.query(`ALTER TABLE "members_contacts" DROP COLUMN "is_default"`);

		for (const column of ["mobile", "email"]) {
			await queryRunner.query(`ALTER TABLE "members_contacts" ALTER COLUMN "${column}" DROP NOT NULL`);
			await queryRunner.query(`ALTER TABLE "members_contacts" ALTER COLUMN "${column}" DROP DEFAULT`);
			await queryRunner.query(
				`ALTER TABLE "members_contacts" ALTER COLUMN "${column}" TYPE character varying USING (CASE WHEN cardinality("${column}") > 0 THEN "${column}"[1] ELSE NULL END)`,
			);
		}

		await this.addSearchVector(queryRunner, this.previousExpression);

		await queryRunner.query(`DROP FUNCTION IF EXISTS immutable_array_to_string(text[], text)`);
	}

	private async addSearchVector(queryRunner: QueryRunner, expression: string): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "members_contacts" ADD "search_vector" tsvector GENERATED ALWAYS AS (${expression}) STORED`,
		);
		await queryRunner.query(
			`INSERT INTO "public"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (current_database(), $1, $2, $3, $4, $5)`,
			["public", "members_contacts", "GENERATED_COLUMN", "search_vector", expression],
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_members_contacts_search_vector" ON "members_contacts" USING gin ("search_vector")`,
		);
	}

	private async dropSearchVector(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_members_contacts_search_vector"`);
		await queryRunner.query(
			`DELETE FROM "public"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = current_database() AND "schema" = $3 AND "table" = $4`,
			["GENERATED_COLUMN", "search_vector", "public", "members_contacts"],
		);
		await queryRunner.query(`ALTER TABLE "members_contacts" DROP COLUMN "search_vector"`);
	}
}
