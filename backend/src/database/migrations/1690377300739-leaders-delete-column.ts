import { MigrationInterface, QueryRunner } from "typeorm";

export class LeadersDeleteColumn1690377300739 implements MigrationInterface {
	name = "LeadersDeleteColumn1690377300739";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "members" ADD "deleted_at" TIMESTAMP`);
		await queryRunner.query(`ALTER TABLE "members" ALTER COLUMN "nickname" SET NOT NULL`);
		await queryRunner.query(`ALTER TYPE "public"."members_role_enum" RENAME TO "members_role_enum_old"`);
		await queryRunner.query(`CREATE TYPE "public"."members_role_enum" AS ENUM('dite', 'instruktor', 'vedouci')`);
		await queryRunner.query(
			`ALTER TABLE "members" ALTER COLUMN "role" TYPE "public"."members_role_enum" USING "role"::"text"::"public"."members_role_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."members_role_enum_old"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE TYPE "public"."members_role_enum_old" AS ENUM('clen', 'vedouci')`);
		await queryRunner.query(
			`ALTER TABLE "members" ALTER COLUMN "role" TYPE "public"."members_role_enum_old" USING "role"::"text"::"public"."members_role_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."members_role_enum"`);
		await queryRunner.query(`ALTER TYPE "public"."members_role_enum_old" RENAME TO "members_role_enum"`);
		await queryRunner.query(`ALTER TABLE "members" ALTER COLUMN "nickname" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "deleted_at"`);
	}
}
