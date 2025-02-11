import { MigrationInterface, QueryRunner } from "typeorm";

export class albumsEventsCascade1674747962819 implements MigrationInterface {
    name = 'albumsEventsCascade1674747962819'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" DROP CONSTRAINT "FK_ae25e5f656138bf2d404a002b2b"`);
        await queryRunner.query(`ALTER TABLE "albums" ADD CONSTRAINT "FK_ae25e5f656138bf2d404a002b2b" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" DROP CONSTRAINT "FK_ae25e5f656138bf2d404a002b2b"`);
        await queryRunner.query(`ALTER TABLE "albums" ADD CONSTRAINT "FK_ae25e5f656138bf2d404a002b2b" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
