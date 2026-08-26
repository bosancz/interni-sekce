import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentSettings1787776310897 implements MigrationInterface {
    name = 'PaymentSettings1787776310897'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "payment_settings" ("id" SERIAL NOT NULL, "account_number" character varying NOT NULL, "bank_code" character varying NOT NULL, "iban" character varying NOT NULL, "amount" integer NOT NULL, "currency" character varying NOT NULL, CONSTRAINT "PK_78624861ce2178d6835fb1d9fdf" PRIMARY KEY ("id"))`);
        // Seed the single settings row with the club's current account and fee. Everything the
        // payment UI shows is read from here, so it can be changed later without a deploy.
        // The IBAN is stored as given – it is never computed from the account number.
        await queryRunner.query(
            `INSERT INTO "payment_settings" ("account_number", "bank_code", "iban", "amount", "currency") VALUES ($1, $2, $3, $4, $5)`,
            ["2301695140", "2010", "CZ6520100000002301695140", 1500, "CZK"],
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // dropping the table takes the seeded row with it
        await queryRunner.query(`DROP TABLE "payment_settings"`);
    }

}
