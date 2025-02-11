import { MigrationInterface, QueryRunner } from "typeorm";

export class MemberProblemsAllergies1690448322355 implements MigrationInterface {
    name = 'MemberProblemsAllergies1690448322355'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "members" ADD "known_problems" text`);
        await queryRunner.query(`ALTER TABLE "members" ADD "allergies" text`);
        await queryRunner.query(`ALTER TABLE "members" ADD "insurance_card_file" character varying`);
        await queryRunner.query(`ALTER TABLE "members" ALTER COLUMN "role" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "members" ALTER COLUMN "role" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "insurance_card_file"`);
        await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "allergies"`);
        await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "known_problems"`);
    }

}
