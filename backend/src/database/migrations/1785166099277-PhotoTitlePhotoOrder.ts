import { MigrationInterface, QueryRunner } from "typeorm";

export class PhotoTitlePhotoOrder1785166099277 implements MigrationInterface {
    name = 'PhotoTitlePhotoOrder1785166099277'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photos" ADD "title_photo_order" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "title_photo_order"`);
    }

}
