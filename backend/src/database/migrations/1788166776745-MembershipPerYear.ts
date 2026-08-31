import { MigrationInterface, QueryRunner } from "typeorm";

export class MembershipPerYear1788166776745 implements MigrationInterface {
	name = "MembershipPerYear1788166776745";

	// The membership enum (clen/neclen/pozastaveno) becomes one flag per year, index 1 (Postgres
	// arrays are 1-based) being MEMBERSHIP_FIRST_YEAR = 2026 — see helpers/membership.ts.
	//
	// The generator emits a plain DROP + ADD, which would throw the existing membership away. The
	// old column is therefore kept alongside the new one until the values are carried over: a member
	// who was `clen` has the fee for the first year paid, `neclen`/`pozastaveno` start unpaid.

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "members" RENAME COLUMN "membership" TO "membership_old"`);
		await queryRunner.query(
			`ALTER TABLE "members" ADD "membership" boolean array NOT NULL DEFAULT array_fill(false, ARRAY[101])`,
		);
		await queryRunner.query(`UPDATE "members" SET "membership"[1] = true WHERE "membership_old" = 'clen'`);
		await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "membership_old"`);
		await queryRunner.query(`DROP TYPE "public"."members_membership_enum"`);
	}

	// Reverses up() as faithfully as the enum allows: a paid first year is `clen`, everything else
	// `neclen` (the distinction between `neclen` and `pozastaveno` does not survive the round trip).
	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "members" RENAME COLUMN "membership" TO "membership_old"`);
		await queryRunner.query(
			`CREATE TYPE "public"."members_membership_enum" AS ENUM('clen', 'neclen', 'pozastaveno')`,
		);
		await queryRunner.query(
			`ALTER TABLE "members" ADD "membership" "public"."members_membership_enum" NOT NULL DEFAULT 'clen'`,
		);
		await queryRunner.query(
			`UPDATE "members" SET "membership" = 'neclen' WHERE NOT COALESCE("membership_old"[1], false)`,
		);
		await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "membership_old"`);
	}
}
