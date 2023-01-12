import { MigrationInterface, QueryRunner } from "typeorm";

export class albumsPhotoTimestamp1673542546771 implements MigrationInterface {
    name = 'albumsPhotoTimestamp1673542546771'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photos" RENAME COLUMN "date" TO "timestamp"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photos" RENAME COLUMN "timestamp" TO "date"`);
    }

}
