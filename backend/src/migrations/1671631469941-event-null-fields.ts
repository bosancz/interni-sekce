import { MigrationInterface, QueryRunner } from "typeorm";

export class eventNullFields1671631469941 implements MigrationInterface {
    name = 'eventNullFields1671631469941'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_ca57b2c41c774ad0a89d3a74c61"`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "album_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status_note" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "place" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "description" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "time_from" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "time_till" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "meeting_place_start" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "meeting_place_end" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "type" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "water_km" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "river" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_ca57b2c41c774ad0a89d3a74c61" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_ca57b2c41c774ad0a89d3a74c61"`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "river" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "water_km" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "type" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "meeting_place_end" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "meeting_place_start" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "time_till" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "time_from" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "description" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "place" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status_note" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "album_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_ca57b2c41c774ad0a89d3a74c61" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
