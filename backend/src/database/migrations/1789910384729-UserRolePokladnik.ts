import { MigrationInterface, QueryRunner } from "typeorm";

export class UserRolePokladnik1789910384729 implements MigrationInterface {
	name = "UserRolePokladnik1789910384729";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TYPE "public"."users_roles_enum" RENAME TO "users_roles_enum_old"`);
		await queryRunner.query(
			`CREATE TYPE "public"."users_roles_enum" AS ENUM('admin', 'revizor', 'program', 'pokladnik')`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ALTER COLUMN "roles" TYPE "public"."users_roles_enum"[] USING "roles"::"text"::"public"."users_roles_enum"[]`,
		);
		await queryRunner.query(`DROP TYPE "public"."users_roles_enum_old"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."users_roles_enum_old" AS ENUM('admin', 'revizor', 'program')`,
		);
		await queryRunner.query(
			`UPDATE "users" SET "roles" = array_remove("roles", 'pokladnik'::"public"."users_roles_enum") WHERE 'pokladnik' = ANY("roles")`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ALTER COLUMN "roles" TYPE "public"."users_roles_enum_old"[] USING "roles"::"text"::"public"."users_roles_enum_old"[]`,
		);
		await queryRunner.query(`DROP TYPE "public"."users_roles_enum"`);
		await queryRunner.query(`ALTER TYPE "public"."users_roles_enum_old" RENAME TO "users_roles_enum"`);
	}
}
