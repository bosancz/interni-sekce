import { MigrationInterface, QueryRunner } from "typeorm";

export class MembershipPaymentAmount1789456934746 implements MigrationInterface {
	name = "MembershipPaymentAmount1789456934746";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "membership_payments" ADD "amount" integer`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "membership_payments" DROP COLUMN "amount"`);
	}
}
