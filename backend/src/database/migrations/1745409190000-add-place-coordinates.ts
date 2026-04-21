import { MigrationInterface, QueryRunner } from "typeorm";

export class addPlaceCoordinates1745409190000 implements MigrationInterface {
    name = 'addPlaceCoordinates1745409190000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ADD "place_coordinates" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "place_coordinates"`);
    }

}
