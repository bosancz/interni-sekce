import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotoTitlePhoto1787578025261 implements MigrationInterface {
    name = 'PhotoTitlePhoto1787578025261'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photos" ADD "title_photo" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "title_photo"`);
    }

}
