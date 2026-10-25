import { MigrationInterface, QueryRunner } from "typeorm";

export class UserEmailNullable1792928733526 implements MigrationInterface {
	name = "UserEmailNullable1792928733526";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL`);
	}
}
