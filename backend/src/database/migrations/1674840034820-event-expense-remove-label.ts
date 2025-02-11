import { MigrationInterface, QueryRunner } from "typeorm";

export class eventExpenseRemoveLabel1674840034820 implements MigrationInterface {
  name = "eventExpenseRemoveLabel1674840034820";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events_expenses" DROP COLUMN "label"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events_expenses" ADD "label" character varying`);
  }
}
