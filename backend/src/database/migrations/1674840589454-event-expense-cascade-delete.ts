import { MigrationInterface, QueryRunner } from "typeorm";

export class eventExpenseCascadeDelete1674840589454 implements MigrationInterface {
    name = 'eventExpenseCascadeDelete1674840589454'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events_expenses" DROP CONSTRAINT "FK_28edbab9122c71c02cdf14ed108"`);
        await queryRunner.query(`ALTER TABLE "events_expenses" ADD CONSTRAINT "FK_28edbab9122c71c02cdf14ed108" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events_expenses" DROP CONSTRAINT "FK_28edbab9122c71c02cdf14ed108"`);
        await queryRunner.query(`ALTER TABLE "events_expenses" ADD CONSTRAINT "FK_28edbab9122c71c02cdf14ed108" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    }

}
