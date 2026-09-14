import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * A recorded membership fee can carry the treasurer's note.
 *
 * The columns say what was paid for and under which symbol, never why the payment looks the way it
 * does — "zaplaceno na táboře", "sourozenecká sleva", "zbytek doplatí v lednu". That belongs to the
 * payment, so it is a column on it: un-record the fee and the note goes with it.
 *
 * Nullable and text: every fee recorded so far has no note, and the ones worth writing down are
 * sentences rather than a code from a list.
 */
export class MembershipPaymentNote1788682748742 implements MigrationInterface {
	name = "MembershipPaymentNote1788682748742";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "membership_payments" ADD "note" text`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "membership_payments" DROP COLUMN "note"`);
	}
}
