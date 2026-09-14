import { MigrationInterface, QueryRunner } from "typeorm";

export class MemberInsuranceCardExpiration1787906952700 implements MigrationInterface {
    name = 'MemberInsuranceCardExpiration1787906952700'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "members" ADD "insurance_card_expiration" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "insurance_card_expiration"`);
    }

}
