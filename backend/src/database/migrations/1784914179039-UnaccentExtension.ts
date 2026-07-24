import { MigrationInterface, QueryRunner } from "typeorm";

export class UnaccentExtension1784914179039 implements MigrationInterface {
    name = 'UnaccentExtension1784914179039'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable Postgres `unaccent` so text search can strip diacritics
        // (e.g. "putak" matches "Puťák"). The extension has no entity
        // representation, so TypeORM cannot generate this statement.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "unaccent"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP EXTENSION IF EXISTS "unaccent"`);
    }

}
