import { MigrationInterface, QueryRunner } from "typeorm";

export class ExpensesReceiptId1707585178877 implements MigrationInterface {
  name = "ExpensesReceiptId1707585178877";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events_expenses" ADD "receipt_number" character varying NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_a6aeb17233427f9165e9661448" ON "events_groups" ("event_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_0593cf7f0f7560db1b5ad7a6f3" ON "events_groups" ("group_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_0593cf7f0f7560db1b5ad7a6f3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a6aeb17233427f9165e9661448"`);
    await queryRunner.query(`ALTER TABLE "events_expenses" DROP COLUMN "receipt_number"`);
    await queryRunner.query(`ALTER TABLE "events" ADD "deleted_at" TIMESTAMP`);
  }
}
