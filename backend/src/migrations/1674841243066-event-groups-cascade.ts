import { MigrationInterface, QueryRunner } from "typeorm";

export class eventGroupsCascade1674841243066 implements MigrationInterface {
    name = 'eventGroupsCascade1674841243066'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events_groups" DROP CONSTRAINT "FK_0593cf7f0f7560db1b5ad7a6f31"`);
        await queryRunner.query(`ALTER TABLE "events_groups" DROP CONSTRAINT "FK_a6aeb17233427f9165e96614484"`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD CONSTRAINT "FK_a6aeb17233427f9165e96614484" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD CONSTRAINT "FK_0593cf7f0f7560db1b5ad7a6f31" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events_groups" DROP CONSTRAINT "FK_0593cf7f0f7560db1b5ad7a6f31"`);
        await queryRunner.query(`ALTER TABLE "events_groups" DROP CONSTRAINT "FK_a6aeb17233427f9165e96614484"`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD CONSTRAINT "FK_a6aeb17233427f9165e96614484" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD CONSTRAINT "FK_0593cf7f0f7560db1b5ad7a6f31" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    }

}
