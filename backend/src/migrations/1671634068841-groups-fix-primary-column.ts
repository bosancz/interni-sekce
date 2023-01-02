import { MigrationInterface, QueryRunner } from "typeorm";

export class groupsFixPrimaryColumn1671634068841 implements MigrationInterface {
    name = 'groupsFixPrimaryColumn1671634068841'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events_groups" DROP CONSTRAINT "FK_0593cf7f0f7560db1b5ad7a6f31"`);
        await queryRunner.query(`ALTER TABLE "members" DROP CONSTRAINT "FK_b9dc6083fb1fc597d2018a19e84"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "PK_659d1483316afb28afd3a90646e"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groups" ADD CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "group_id"`);
        await queryRunner.query(`ALTER TABLE "members" ADD "group_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events_groups" DROP CONSTRAINT "PK_3f4996f9f06ad47e98c6809e9be"`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD CONSTRAINT "PK_a6aeb17233427f9165e96614484" PRIMARY KEY ("event_id")`);
        await queryRunner.query(`ALTER TABLE "events_groups" DROP COLUMN "group_id"`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD "group_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events_groups" DROP CONSTRAINT "PK_a6aeb17233427f9165e96614484"`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD CONSTRAINT "PK_3f4996f9f06ad47e98c6809e9be" PRIMARY KEY ("event_id", "group_id")`);
        await queryRunner.query(`ALTER TABLE "members" ADD CONSTRAINT "FK_b9dc6083fb1fc597d2018a19e84" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD CONSTRAINT "FK_0593cf7f0f7560db1b5ad7a6f31" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events_groups" DROP CONSTRAINT "FK_0593cf7f0f7560db1b5ad7a6f31"`);
        await queryRunner.query(`ALTER TABLE "members" DROP CONSTRAINT "FK_b9dc6083fb1fc597d2018a19e84"`);
        await queryRunner.query(`ALTER TABLE "events_groups" DROP CONSTRAINT "PK_3f4996f9f06ad47e98c6809e9be"`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD CONSTRAINT "PK_a6aeb17233427f9165e96614484" PRIMARY KEY ("event_id")`);
        await queryRunner.query(`ALTER TABLE "events_groups" DROP COLUMN "group_id"`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD "group_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events_groups" DROP CONSTRAINT "PK_a6aeb17233427f9165e96614484"`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD CONSTRAINT "PK_3f4996f9f06ad47e98c6809e9be" PRIMARY KEY ("event_id", "group_id")`);
        await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "group_id"`);
        await queryRunner.query(`ALTER TABLE "members" ADD "group_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "PK_659d1483316afb28afd3a90646e"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groups" ADD CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "members" ADD CONSTRAINT "FK_b9dc6083fb1fc597d2018a19e84" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD CONSTRAINT "FK_0593cf7f0f7560db1b5ad7a6f31" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    }

}
