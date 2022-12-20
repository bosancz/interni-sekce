import { MigrationInterface, QueryRunner } from "typeorm";

export class users1671534742863 implements MigrationInterface {
    name = 'users1671534742863'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_roles_enum" AS ENUM('vedouci', 'clen')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "member_id" integer NOT NULL, "login" character varying NOT NULL, "password" character varying NOT NULL, "email" character varying NOT NULL, "roles" "public"."users_roles_enum" array NOT NULL, "login_code" character varying NOT NULL, "login_code_exp" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_2d443082eccd5198f95f2a36e2c" UNIQUE ("login"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_b2a406c01c3a2a8e9cf3b381047" UNIQUE ("login_code"), CONSTRAINT "REL_930e69d96a9cf9bdc32b7a49db" UNIQUE ("member_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "photos" ADD "uploaded_by_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_930e69d96a9cf9bdc32b7a49db1" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "photos" ADD CONSTRAINT "FK_9b0854162727b896a7e6e2cab79" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photos" DROP CONSTRAINT "FK_9b0854162727b896a7e6e2cab79"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_930e69d96a9cf9bdc32b7a49db1"`);
        await queryRunner.query(`ALTER TABLE "photos" DROP COLUMN "uploaded_by_id"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_roles_enum"`);
    }

}
