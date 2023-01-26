import { MigrationInterface, QueryRunner } from "typeorm";

export class membershipType1674750492389 implements MigrationInterface {
    name = 'membershipType1674750492389'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "membership"`);
        await queryRunner.query(`CREATE TYPE "public"."members_membership_enum" AS ENUM('clen', 'neclen', 'pozastaveno')`);
        await queryRunner.query(`ALTER TABLE "members" ADD "membership" "public"."members_membership_enum" NOT NULL DEFAULT 'clen'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "membership"`);
        await queryRunner.query(`DROP TYPE "public"."members_membership_enum"`);
        await queryRunner.query(`ALTER TABLE "members" ADD "membership" boolean NOT NULL DEFAULT true`);
    }

}
