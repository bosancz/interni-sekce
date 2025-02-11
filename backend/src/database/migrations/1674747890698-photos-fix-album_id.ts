import { MigrationInterface, QueryRunner } from "typeorm";

export class photosFixAlbumId1674747890698 implements MigrationInterface {
    name = 'photosFixAlbumId1674747890698'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photos" DROP CONSTRAINT "FK_f012e62aaf25a8210ed0d935f0e"`);
        await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "albumId"`);
        await queryRunner.query(`ALTER TABLE "photos" ADD CONSTRAINT "FK_46e00f649a90c9f5cdcc45c5059" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photos" DROP CONSTRAINT "FK_46e00f649a90c9f5cdcc45c5059"`);
        await queryRunner.query(`ALTER TABLE "photos" ADD "albumId" integer`);
        await queryRunner.query(`ALTER TABLE "photos" ADD CONSTRAINT "FK_f012e62aaf25a8210ed0d935f0e" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    }

}
