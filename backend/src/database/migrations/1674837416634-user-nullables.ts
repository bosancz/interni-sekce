import { MigrationInterface, QueryRunner } from "typeorm";

export class userNullables1674837416634 implements MigrationInterface {
    name = 'userNullables1674837416634'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "login_code" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "login_code_exp" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "login_code_exp" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "login_code" SET NOT NULL`);
    }

}
