import { MigrationInterface, QueryRunner } from "typeorm";

export class albumsEventsMoveId1674747422432 implements MigrationInterface {
    name = 'albumsEventsMoveId1674747422432'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_ca57b2c41c774ad0a89d3a74c61"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "UQ_ca57b2c41c774ad0a89d3a74c61"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "album_id"`);
        await queryRunner.query(`ALTER TABLE "albums" ADD "event_id" integer`);
        await queryRunner.query(`ALTER TABLE "albums" ADD CONSTRAINT "UQ_ae25e5f656138bf2d404a002b2b" UNIQUE ("event_id")`);
        await queryRunner.query(`ALTER TABLE "albums" ADD CONSTRAINT "FK_ae25e5f656138bf2d404a002b2b" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" DROP CONSTRAINT "FK_ae25e5f656138bf2d404a002b2b"`);
        await queryRunner.query(`ALTER TABLE "albums" DROP CONSTRAINT "UQ_ae25e5f656138bf2d404a002b2b"`);
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "event_id"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "album_id" integer`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "UQ_ca57b2c41c774ad0a89d3a74c61" UNIQUE ("album_id")`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_ca57b2c41c774ad0a89d3a74c61" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
