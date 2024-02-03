import { MigrationInterface, QueryRunner } from "typeorm";

export class MemberAllergiesArray1706981805383 implements MigrationInterface {
  name = "MemberAllergiesArray1706981805383";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "allergies"`);
    await queryRunner.query(`ALTER TABLE "members" ADD "allergies" character varying array`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "allergies"`);
    await queryRunner.query(`ALTER TABLE "members" ADD "allergies" text`);
  }
}
