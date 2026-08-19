import { MigrationInterface, QueryRunner } from "typeorm";

export class SearchVectorContacts1787132180958 implements MigrationInterface {
    name = 'SearchVectorContacts1787132180958'

    private readonly membersExpression = "to_tsvector('simple_unaccent', coalesce(nickname, '') || ' ' || coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || regexp_replace(regexp_replace(coalesce(mobile, ''), '(?<=[[:digit:]])[[:space:]-]+(?=[[:digit:]])', '', 'g'), '([+]|00)420', '', 'g') || ' ' || translate(coalesce(email, ''), '@._+-', '     '))";

    private readonly membersPreviousExpression = "to_tsvector('simple_unaccent', coalesce(nickname, '') || ' ' || coalesce(first_name, '') || ' ' || coalesce(last_name, ''))";

    private readonly contactsExpression = "to_tsvector('simple_unaccent', coalesce(name, '') || ' ' || regexp_replace(regexp_replace(coalesce(mobile, ''), '(?<=[[:digit:]])[[:space:]-]+(?=[[:digit:]])', '', 'g'), '([+]|00)420', '', 'g') || ' ' || translate(coalesce(email, ''), '@._+-', '     '))";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.addColumn(queryRunner, "members_contacts", this.contactsExpression);

        await this.dropColumn(queryRunner, "members");
        await this.addColumn(queryRunner, "members", this.membersExpression);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropColumn(queryRunner, "members");
        await this.addColumn(queryRunner, "members", this.membersPreviousExpression);

        await this.dropColumn(queryRunner, "members_contacts");
    }

    private indexName(table: string): string {
        return `IDX_${table}_search_vector`;
    }

    private async addColumn(queryRunner: QueryRunner, table: string, expression: string): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${table}" ADD "search_vector" tsvector GENERATED ALWAYS AS (${expression}) STORED`);
        await queryRunner.query(
            `INSERT INTO "public"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (current_database(), $1, $2, $3, $4, $5)`,
            ["public", table, "GENERATED_COLUMN", "search_vector", expression],
        );
        await queryRunner.query(`CREATE INDEX "${this.indexName(table)}" ON "${table}" USING gin ("search_vector")`);
    }

    private async dropColumn(queryRunner: QueryRunner, table: string): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."${this.indexName(table)}"`);
        await queryRunner.query(
            `DELETE FROM "public"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = current_database() AND "schema" = $3 AND "table" = $4`,
            ["GENERATED_COLUMN", "search_vector", "public", table],
        );
        await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "search_vector"`);
    }

}
