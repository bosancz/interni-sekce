import { MigrationInterface, QueryRunner } from "typeorm";

export class photosNullableFields1674745359073 implements MigrationInterface {
    name = 'photosNullableFields1674745359073'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photos" DROP CONSTRAINT "FK_9b0854162727b896a7e6e2cab79"`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "uploaded_by_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "title" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "caption" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "width" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "height" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "timestamp" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "tags" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "bg" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ADD CONSTRAINT "FK_9b0854162727b896a7e6e2cab79" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photos" DROP CONSTRAINT "FK_9b0854162727b896a7e6e2cab79"`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "bg" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "tags" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "timestamp" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "height" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "width" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "caption" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "title" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ALTER COLUMN "uploaded_by_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "photos" ADD CONSTRAINT "FK_9b0854162727b896a7e6e2cab79" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

}
