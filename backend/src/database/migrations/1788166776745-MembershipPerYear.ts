import { MigrationInterface, QueryRunner } from "typeorm";

export class MembershipPerYear1788166776745 implements MigrationInterface {
	name = "MembershipPerYear1788166776745";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "membership"`);
		await queryRunner.query(`DROP TYPE "public"."members_membership_enum"`);
		await queryRunner.query(
			`ALTER TABLE "members" ADD "membership" boolean array NOT NULL DEFAULT array_fill(false, ARRAY[101])`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "membership"`);
		await queryRunner.query(
			`CREATE TYPE "public"."members_membership_enum" AS ENUM('clen', 'neclen', 'pozastaveno')`,
		);
		await queryRunner.query(
			`ALTER TABLE "members" ADD "membership" "public"."members_membership_enum" NOT NULL DEFAULT 'clen'`,
		);
	}
}
