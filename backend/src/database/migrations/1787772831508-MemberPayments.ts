import { MigrationInterface, QueryRunner } from "typeorm";

export class MemberPayments1787772831508 implements MigrationInterface {
    name = 'MemberPayments1787772831508'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "members_payment" ("id" SERIAL NOT NULL, "member_id" integer NOT NULL, "amount" integer NOT NULL, "payment_date" date, CONSTRAINT "PK_9b143f3e114d7992f5fdd1ec1c1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "members_payment" ADD CONSTRAINT "FK_80db4440f692fe6b11fe53a890c" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "members_payment" DROP CONSTRAINT "FK_80db4440f692fe6b11fe53a890c"`);
        await queryRunner.query(`DROP TABLE "members_payment"`);
    }

}
