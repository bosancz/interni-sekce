import { MigrationInterface, QueryRunner } from "typeorm";

export class UserRolesNull1689010701347 implements MigrationInterface {
	name = "UserRolesNull1689010701347";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "name" SET NOT NULL`);
		await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "timestamp" SET NOT NULL`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "timestamp" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "name" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" SET NOT NULL`);
	}
}
