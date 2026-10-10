import { MigrationInterface, QueryRunner } from "typeorm";

export class GroupShortNameUnique1791624789345 implements MigrationInterface {
	name = "GroupShortNameUnique1791624789345";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`UPDATE "groups" g SET "short_name" = g."short_name" || ' (' || g."id" || ')' WHERE EXISTS (SELECT 1 FROM "groups" o WHERE o."short_name" = g."short_name" AND o."id" < g."id")`,
		);
		await queryRunner.query(
			`ALTER TABLE "groups" ADD CONSTRAINT "UQ_1d1fa009c02dc1a6ccebf006c28" UNIQUE ("short_name")`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "UQ_1d1fa009c02dc1a6ccebf006c28"`);
	}
}
