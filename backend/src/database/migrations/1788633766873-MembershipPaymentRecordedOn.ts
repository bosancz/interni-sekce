import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * The recorded fee stops claiming to know how much was paid, and its date says what it is.
 *
 * `amount` was copied from the club's payment settings every time a fee was ticked off, so it only
 * ever said "the fee in force today" — which is not what members actually pay: someone joining in
 * September pays a part of the year, a camp can cover the rest of it, and some pay by instalments.
 * A number that is wrong more often than not is worse than no number, and what really came in is
 * in the bank statement, so the column goes.
 *
 * `date` is renamed to `recorded_on` for the same reason: it is the day the treasurer wrote the
 * fee down, never the day the payment was made, and the old name let the two be read as one. The
 * rename keeps the dates already recorded — hence RENAME COLUMN rather than the drop-and-add the
 * generator suggests.
 */
export class MembershipPaymentRecordedOn1788633766873 implements MigrationInterface {
	name = "MembershipPaymentRecordedOn1788633766873";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "membership_payments" DROP COLUMN "amount"`);
		await queryRunner.query(`ALTER TABLE "membership_payments" RENAME COLUMN "date" TO "recorded_on"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "membership_payments" RENAME COLUMN "recorded_on" TO "date"`);

		// The amounts themselves are gone for good, so they come back the way the fees migrated from
		// the old list of years got theirs: the fee in force today, out of the payment settings.
		await queryRunner.query(`ALTER TABLE "membership_payments" ADD "amount" integer`);
		await queryRunner.query(
			`UPDATE "membership_payments" SET "amount" = COALESCE((SELECT s."amount" FROM "payment_settings" s ORDER BY s."id" ASC LIMIT 1), 0)`,
		);
		await queryRunner.query(`ALTER TABLE "membership_payments" ALTER COLUMN "amount" SET NOT NULL`);
	}
}
