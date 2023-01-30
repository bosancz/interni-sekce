import { MigrationInterface, QueryRunner } from "typeorm";

export class photosRestrictDelete1675090331797 implements MigrationInterface {
    name = 'photosRestrictDelete1675090331797'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photo_faces" DROP CONSTRAINT "FK_85f717bcf5979c9a977051fb0b1"`);
        await queryRunner.query(`ALTER TABLE "photo_faces" DROP CONSTRAINT "FK_ad00f96563219eb5a9a507f70d8"`);
        await queryRunner.query(`ALTER TABLE "photo_faces" ADD CONSTRAINT "FK_ad00f96563219eb5a9a507f70d8" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "photo_faces" ADD CONSTRAINT "FK_85f717bcf5979c9a977051fb0b1" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photo_faces" DROP CONSTRAINT "FK_85f717bcf5979c9a977051fb0b1"`);
        await queryRunner.query(`ALTER TABLE "photo_faces" DROP CONSTRAINT "FK_ad00f96563219eb5a9a507f70d8"`);
        await queryRunner.query(`ALTER TABLE "photo_faces" ADD CONSTRAINT "FK_ad00f96563219eb5a9a507f70d8" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "photo_faces" ADD CONSTRAINT "FK_85f717bcf5979c9a977051fb0b1" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

}
