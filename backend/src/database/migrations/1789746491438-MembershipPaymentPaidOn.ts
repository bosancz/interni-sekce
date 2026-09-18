import { MigrationInterface, QueryRunner } from "typeorm";

const NOTE_DATE_PATTERN = String.raw`^\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\s*$`;

export class MembershipPaymentPaidOn1789746491438 implements MigrationInterface {
	name = "MembershipPaymentPaidOn1789746491438";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "membership_payments" ADD "paid_on" date`);

		await queryRunner.query(`
			DO $$
			DECLARE
				payment record;
				parsed date;
			BEGIN
				FOR payment IN
					SELECT "id", regexp_match("note", '${NOTE_DATE_PATTERN}') AS "parts"
					FROM "membership_payments"
					WHERE "note" IS NOT NULL
				LOOP
					IF payment."parts" IS NULL THEN
						CONTINUE;
					END IF;

					BEGIN
						parsed := make_date(
							payment."parts"[3]::int,
							payment."parts"[2]::int,
							payment."parts"[1]::int
						);
					EXCEPTION WHEN OTHERS THEN
						parsed := NULL;
					END;

					IF parsed IS NOT NULL THEN
						UPDATE "membership_payments"
						SET "paid_on" = parsed, "note" = NULL
						WHERE "id" = payment."id";
					END IF;
				END LOOP;
			END $$;
		`);

		await queryRunner.query(`ALTER TABLE "membership_payments" DROP COLUMN "recorded_on"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "membership_payments" ADD "recorded_on" date`);

		await queryRunner.query(
			`UPDATE "membership_payments" SET "note" = to_char("paid_on", 'FMDD.FMMM.YYYY') WHERE "paid_on" IS NOT NULL AND "note" IS NULL`,
		);

		await queryRunner.query(`ALTER TABLE "membership_payments" DROP COLUMN "paid_on"`);
	}
}
