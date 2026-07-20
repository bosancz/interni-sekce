import { MigrationInterface, QueryRunner } from "typeorm";

export class UserMemberIdIndex1784730000000 implements MigrationInterface {
	name = "UserMemberIdIndex1784730000000";

	public async up(queryRunner: QueryRunner): Promise<void> {
		// the linked member is joined on every request to resolve the user's roles
		await queryRunner.query(`CREATE INDEX "IDX_users_member_id" ON "users" ("member_id")`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_users_member_id"`);
	}
}
