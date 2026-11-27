import { MigrationInterface, QueryRunner } from "typeorm";

export class GroupMemberships1795711528520 implements MigrationInterface {
	name = "GroupMemberships1795711528520";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "members" DROP CONSTRAINT "FK_b9dc6083fb1fc597d2018a19e84"`);
		await queryRunner.query(
			`CREATE TABLE "members_groups" ("id" SERIAL NOT NULL, "member_id" integer NOT NULL, "group_id" integer NOT NULL, "year_from" integer, "year_till" integer, CONSTRAINT "CHK_members_groups_years" CHECK (year_till IS NULL OR year_till >= year_from), CONSTRAINT "PK_4735bf152f1cf3771e2c80d83b1" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`CREATE INDEX "IDX_members_groups_member_id" ON "members_groups" ("member_id") `);
		await queryRunner.query(`CREATE INDEX "IDX_members_groups_group_id" ON "members_groups" ("group_id") `);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_members_groups_active_member" ON "members_groups" ("member_id") WHERE year_till IS NULL`,
		);
		await queryRunner.query(
			`ALTER TABLE "members_groups" ADD CONSTRAINT "FK_cb8763277eaff123a96eaf28ce0" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(
			`ALTER TABLE "members_groups" ADD CONSTRAINT "FK_d652fbc26809e096d5feb0c2c77" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
		);

		await queryRunner.query(`
			INSERT INTO "members_groups" ("member_id", "group_id", "year_from", "year_till")
			SELECT
				m.id,
				m.group_id,
				NULL,
				CASE WHEN m.active THEN NULL ELSE EXTRACT(YEAR FROM CURRENT_DATE)::int END
			FROM members m
		`);

		await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "group_id"`);
		await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "active"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "members" ADD "active" boolean NOT NULL DEFAULT true`);
		await queryRunner.query(`ALTER TABLE "members" ADD "group_id" integer`);
		await queryRunner.query(`
			UPDATE "members" m SET
				"active" = EXISTS (SELECT 1 FROM members_groups mg WHERE mg.member_id = m.id AND mg.year_till IS NULL),
				"group_id" = COALESCE(
					(SELECT mg.group_id FROM members_groups mg WHERE mg.member_id = m.id ORDER BY mg.year_till DESC NULLS FIRST, mg.year_from DESC, mg.id DESC LIMIT 1),
					(SELECT MIN(g.id) FROM groups g)
				)
		`);
		await queryRunner.query(`ALTER TABLE "members" ALTER COLUMN "group_id" SET NOT NULL`);

		await queryRunner.query(`ALTER TABLE "members_groups" DROP CONSTRAINT "FK_d652fbc26809e096d5feb0c2c77"`);
		await queryRunner.query(`ALTER TABLE "members_groups" DROP CONSTRAINT "FK_cb8763277eaff123a96eaf28ce0"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_members_groups_active_member"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_members_groups_group_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_members_groups_member_id"`);
		await queryRunner.query(`DROP TABLE "members_groups"`);
		await queryRunner.query(
			`ALTER TABLE "members" ADD CONSTRAINT "FK_b9dc6083fb1fc597d2018a19e84" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
		);
	}
}
