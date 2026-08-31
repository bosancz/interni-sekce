import { MigrationInterface, QueryRunner } from "typeorm";

/** The season the club switched from a membership state to a fee paid per year. */
const FIRST_FEE_YEAR = 2026;

/**
 * Brings databases that ran the earlier shape of this branch onto the current schema.
 *
 * MembershipPerYear first stored the membership as an array of booleans indexed by year and this
 * branch also carried a members_payment table; both were reworked while the branch was unmerged,
 * so a database that had already run them keeps the old shape — the migration is recorded as run
 * and never executes again. Production has run neither, hence the guards: on a database that
 * already has the current schema every step below is a no-op.
 */
export class MembershipYearsArray1788171069959 implements MigrationInterface {
	name = "MembershipYearsArray1788171069959";

	public async up(queryRunner: QueryRunner): Promise<void> {
		// The member payments CRUD was dropped from the branch; its table only exists where the
		// (since removed) MemberPayments migration had already run.
		await queryRunner.query(`DROP TABLE IF EXISTS "members_payment"`);

		const [membership] = await queryRunner.query(
			`SELECT udt_name FROM information_schema.columns
			 WHERE table_schema = current_schema() AND table_name = 'members' AND column_name = 'membership'`,
		);

		// _int2 = smallint[]: already the list of paid years, nothing to convert.
		if (!membership || membership.udt_name !== "_bool") return;

		await queryRunner.query(`ALTER TABLE "members" RENAME COLUMN "membership" TO "membership_old"`);
		await queryRunner.query(`ALTER TABLE "members" ADD "membership" smallint array NOT NULL DEFAULT '{}'`);
		// The old array started at FIRST_FEE_YEAR, so its first flag is that year's fee.
		await queryRunner.query(
			`UPDATE "members" SET "membership" = ARRAY[${FIRST_FEE_YEAR}]::smallint[] WHERE COALESCE("membership_old"[1], false)`,
		);
		await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "membership_old"`);
	}

	// Deliberately empty: this migration only converges stale databases onto the schema
	// MembershipPerYear already declares, so there is nothing to give back. Reverting further
	// runs that migration's own down(), which expects exactly this schema.
	public async down(): Promise<void> {}
}
