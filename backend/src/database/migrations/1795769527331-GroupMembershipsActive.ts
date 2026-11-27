import { MigrationInterface, QueryRunner } from "typeorm";

export class GroupMembershipsActive1795769527331 implements MigrationInterface {
	name = "GroupMembershipsActive1795769527331";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "members_groups" ADD "active" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`UPDATE "members_groups" SET "active" = true WHERE "year_till" IS NULL`);
		await queryRunner.query(
			`UPDATE "members_groups" SET "year_till" = NULL WHERE NOT "active" AND "year_from" IS NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "members_groups" ADD CONSTRAINT "CHK_members_groups_active_till" CHECK (NOT active OR year_till IS NULL)`,
		);
		await queryRunner.query(`DROP INDEX "public"."IDX_members_groups_active_member"`);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_members_groups_active_member" ON "members_groups" ("member_id") WHERE active`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_members_groups_active_member"`);
		await queryRunner.query(
			`UPDATE "members_groups" SET "year_till" = GREATEST("year_from", EXTRACT(YEAR FROM CURRENT_DATE)::int) WHERE NOT "active" AND "year_till" IS NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_members_groups_active_member" ON "members_groups" ("member_id") WHERE year_till IS NULL`,
		);
		await queryRunner.query(`ALTER TABLE "members_groups" DROP CONSTRAINT "CHK_members_groups_active_till"`);
		await queryRunner.query(`ALTER TABLE "members_groups" DROP COLUMN "active"`);
	}
}
