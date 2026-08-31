import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentSettingsDropIban1788162725508 implements MigrationInterface {
    name = 'PaymentSettingsDropIban1788162725508'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // The QR platba generator derives the IBAN from the account number and bank code, so
        // nothing reads this column any more. The value it held (CZ65…) was not a valid IBAN –
        // its ISO 7064 check digits came out as 55 instead of 1 – so the QR codes built from it
        // were rejected by banking apps. Dropping it rather than correcting it keeps the account
        // in exactly one place: account_number + bank_code.
        await queryRunner.query(`ALTER TABLE "payment_settings" DROP COLUMN "iban"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // NOT NULL needs a value for the existing settings row, hence the temporary default. It
        // restores the *correct* IBAN of the seeded account, not the invalid one up() removed.
        await queryRunner.query(
            `ALTER TABLE "payment_settings" ADD "iban" character varying NOT NULL DEFAULT 'CZ1120100000002301695140'`,
        );
        await queryRunner.query(`ALTER TABLE "payment_settings" ALTER COLUMN "iban" DROP DEFAULT`);
    }

}
