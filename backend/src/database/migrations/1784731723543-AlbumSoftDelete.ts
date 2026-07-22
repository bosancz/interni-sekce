import { MigrationInterface, QueryRunner } from "typeorm";

export class AlbumSoftDelete1784731723543 implements MigrationInterface {
    name = 'AlbumSoftDelete1784731723543'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "deleted_at"`);
    }

}
