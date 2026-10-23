import { MigrationInterface, QueryRunner } from "typeorm";

export class EventPublicReport1792798135115 implements MigrationInterface {
	name = "EventPublicReport1792798135115";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" ADD "public_report" text`);
		await queryRunner.query(
			`UPDATE "events" SET "public_report" = "report", "report" = NULL WHERE "report_published_at" IS NOT NULL AND "report_published_at" <> "date_till"::timestamp AT TIME ZONE 'Europe/Prague'`,
		);
		await queryRunner.query(
			`UPDATE "events" SET "report_published_at" = NULL WHERE "report_published_at" = "date_till"::timestamp AT TIME ZONE 'Europe/Prague'`,
		);
		await queryRunner.query(
			`UPDATE "events" SET "report" = concat_ws(E'\\n\\n',
				nullif(trim("report"), ''),
				CASE WHEN "report_complications" IS NOT NULL THEN E'**Komplikace:**\\n\\n' || coalesce(nullif(trim("report_complications"), ''), 'Žádné') END,
				CASE WHEN "report_praises" IS NOT NULL THEN E'**Pochvaly:**\\n\\n' || coalesce(nullif(trim("report_praises"), ''), 'Žádné') END,
				CASE WHEN "report_complaints" IS NOT NULL THEN E'**Stížnosti:**\\n\\n' || coalesce(nullif(trim("report_complaints"), ''), 'Žádné') END
			) WHERE "report_complications" IS NOT NULL OR "report_praises" IS NOT NULL OR "report_complaints" IS NOT NULL`,
		);
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "report_complications"`);
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "report_praises"`);
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "report_complaints"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" ADD "report_complaints" text`);
		await queryRunner.query(`ALTER TABLE "events" ADD "report_praises" text`);
		await queryRunner.query(`ALTER TABLE "events" ADD "report_complications" text`);
		await queryRunner.query(
			`UPDATE "events" SET "report_published_at" = "date_till"::timestamp AT TIME ZONE 'Europe/Prague' WHERE "report_published_at" IS NULL AND coalesce(trim("report"), '') <> ''`,
		);
		await queryRunner.query(
			`UPDATE "events" SET "report" = "public_report" WHERE "report_published_at" IS NOT NULL AND "public_report" IS NOT NULL`,
		);
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "public_report"`);
	}
}
