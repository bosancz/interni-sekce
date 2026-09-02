import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * The membership fee stops being a bare list of years on the member and becomes a payment per
 * season, carrying the variable symbol it came in under, the amount and the day it was recorded.
 *
 * The years already stored are kept: each one becomes a payment, with the symbol derived exactly
 * as `helpers/variable-symbol.ts` derives it and the amount taken from the club's payment settings
 * (the fee in force today — nothing recorded what was paid back then). Their date stays null for
 * the same reason, which is why the column is nullable.
 */
export class MembershipPayments1788380722343 implements MigrationInterface {
	name = "MembershipPayments1788380722343";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "membership_payments" ("id" SERIAL NOT NULL, "member_id" integer NOT NULL, "for_year" smallint NOT NULL, "variable_symbol" character varying NOT NULL, "amount" integer NOT NULL, "date" date, CONSTRAINT "PK_52b7d19d02434346f8eaa6cdd04" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_membership_payments_member_year" ON "membership_payments" ("member_id", "for_year") `,
		);
		await queryRunner.query(
			`ALTER TABLE "membership_payments" ADD CONSTRAINT "FK_733b90f80254aaa30625e3fdbbf" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);

		// One payment per year already ticked off, before the column carrying them is dropped.
		await queryRunner.query(
			`INSERT INTO "membership_payments" ("member_id", "for_year", "variable_symbol", "amount", "date")
			 SELECT
				m."id",
				y AS for_year,
				RIGHT(y::text, 2) || LPAD(m."id"::text, 5, '0'),
				COALESCE((SELECT s."amount" FROM "payment_settings" s ORDER BY s."id" ASC LIMIT 1), 0),
				NULL
			 FROM "members" m, LATERAL unnest(m."membership") AS y
			 GROUP BY m."id", y`,
		);

		await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "membership"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "members" ADD "membership" smallint array NOT NULL DEFAULT '{}'`);

		// Back to the list of years — the symbol, amount and date have nowhere to go there.
		await queryRunner.query(
			`UPDATE "members" m SET "membership" = COALESCE((
				SELECT array_agg(p."for_year" ORDER BY p."for_year")
				FROM "membership_payments" p
				WHERE p."member_id" = m."id"
			 ), '{}')`,
		);

		await queryRunner.query(`ALTER TABLE "membership_payments" DROP CONSTRAINT "FK_733b90f80254aaa30625e3fdbbf"`);
		await queryRunner.query(`DROP INDEX "public"."UQ_membership_payments_member_year"`);
		await queryRunner.query(`DROP TABLE "membership_payments"`);
	}
}
