import { MigrationInterface, QueryRunner } from "typeorm";

export class UserSoftDelete1793707506001 implements MigrationInterface {
	name = "UserSoftDelete1793707506001";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
		await queryRunner.query(`ALTER TABLE "users" ADD "deleted_by_id" integer`);
		await queryRunner.query(
			`ALTER TABLE "users" ADD CONSTRAINT "FK_4241f21b9bb35e82a6217af1aad" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_4241f21b9bb35e82a6217af1aad"`);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_by_id"`);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
	}
}
