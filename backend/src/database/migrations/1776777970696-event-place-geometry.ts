import { MigrationInterface, QueryRunner } from "typeorm";

export class EventPlaceGeometry1776777970696 implements MigrationInterface {
	name = "EventPlaceGeometry1776777970696";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
		await queryRunner.query(`ALTER TABLE "events" ADD "place_geometry" geometry(Point,4326)`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "place_geometry"`);
	}
}
