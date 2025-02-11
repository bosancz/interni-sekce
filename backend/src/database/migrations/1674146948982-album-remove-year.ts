import { MigrationInterface, QueryRunner } from "typeorm";

export class albumRemoveYear1674146948982 implements MigrationInterface {
  name = "albumRemoveYear1674146948982";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "year"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "albums" ADD "year" integer NOT NULL DEFAULT 0`);
  }
}
