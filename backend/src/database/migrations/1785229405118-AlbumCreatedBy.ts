import { MigrationInterface, QueryRunner } from "typeorm";

export class AlbumCreatedBy1785229405118 implements MigrationInterface {
	name = "AlbumCreatedBy1785229405118";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "albums" ADD "created_by_id" integer`);
		await queryRunner.query(
			`ALTER TABLE "albums" ADD CONSTRAINT "FK_7cd93bf4f6279611a0b441fd26d" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
		);

		await queryRunner.query(`
            UPDATE "albums" a
            SET "created_by_id" = (
                SELECT u."id"
                FROM "events_attendees" ea
                JOIN "users" u ON u."member_id" = ea."member_id"
                WHERE ea."event_id" = a."event_id" AND ea."type" = 'leader'
                ORDER BY u."id" ASC
                LIMIT 1
            )
            WHERE a."event_id" IS NOT NULL AND a."created_by_id" IS NULL
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "albums" DROP CONSTRAINT "FK_7cd93bf4f6279611a0b441fd26d"`);
		await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "created_by_id"`);
	}
}
