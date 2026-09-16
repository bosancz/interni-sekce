import { MigrationInterface, QueryRunner } from "typeorm";

const MEMBERSHIP_FEE = 1500;

export class MembershipPaymentAmountBackfill1789562125412 implements MigrationInterface {
	name = "MembershipPaymentAmountBackfill1789562125412";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`UPDATE "membership_payments" SET "amount" = $1`, [MEMBERSHIP_FEE]);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`UPDATE "membership_payments" SET "amount" = NULL WHERE "amount" = $1`, [
			MEMBERSHIP_FEE,
		]);
	}
}
