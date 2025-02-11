import { MigrationInterface, QueryRunner } from "typeorm";

export class albumsPhotoFace1673540650873 implements MigrationInterface {
    name = 'albumsPhotoFace1673540650873'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "photo_faces" ("id" SERIAL NOT NULL, "photo_id" integer NOT NULL, "member_id" integer, "location" integer array NOT NULL, "descriptor" cube NOT NULL, CONSTRAINT "PK_3113b2dcbbd3fd2a30927aa2b36" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "photo_faces" ADD CONSTRAINT "FK_ad00f96563219eb5a9a507f70d8" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "photo_faces" ADD CONSTRAINT "FK_85f717bcf5979c9a977051fb0b1" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photo_faces" DROP CONSTRAINT "FK_85f717bcf5979c9a977051fb0b1"`);
        await queryRunner.query(`ALTER TABLE "photo_faces" DROP CONSTRAINT "FK_ad00f96563219eb5a9a507f70d8"`);
        await queryRunner.query(`DROP TABLE "photo_faces"`);
    }

}
