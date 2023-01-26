import { MigrationInterface, QueryRunner } from "typeorm";

export class memberActiveNullable1674751355584 implements MigrationInterface {
  name = "memberActiveNullable1674751355584";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "members" RENAME COLUMN "inactive" TO "active"`);
    await queryRunner.query(`UPDATE "members" SET "active" = NOT "active"`);
    await queryRunner.query(`ALTER TABLE "members" ALTER COLUMN "active" SET DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "members" ALTER COLUMN "active" SET DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "members" RENAME COLUMN "active" TO "inactive"`);
    await queryRunner.query(`UPDATE "members" SET "inactive" = NOT "inactive"`);
  }
}
