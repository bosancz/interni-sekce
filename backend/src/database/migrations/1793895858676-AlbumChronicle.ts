import { copyFile, mkdir, unlink } from "fs/promises";
import { dirname, join } from "path";
import { StaticConfig } from "../../config";
import { MigrationInterface, QueryRunner } from "typeorm";

async function moveFile(from: string, to: string) {
	try {
		await mkdir(dirname(to), { recursive: true });
		await copyFile(from, to);
		await unlink(from);
	} catch (err) {
		console.warn(`AlbumChronicle: failed to move ${from} to ${to}: ${(err as Error).message}`);
	}
}

function eventChroniclePath(event: { id: number; src_id: string | null }) {
	return join(StaticConfig.fs.eventsDir, event.src_id ?? String(event.id), "kronika.pdf");
}

function albumChroniclePath(albumId: number) {
	return join(StaticConfig.fs.albumsDir, String(albumId), "kronika.pdf");
}

export class AlbumChronicle1793895858676 implements MigrationInterface {
	name = "AlbumChronicle1793895858676";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "albums" ADD "chronicle_file_name" character varying`);
		await queryRunner.query(`ALTER TABLE "albums" ADD "chronicle_size" integer`);
		await queryRunner.query(`ALTER TABLE "albums" ADD "chronicle_updated_at" TIMESTAMP WITH TIME ZONE`);

		await queryRunner.query(`
			INSERT INTO "albums" ("event_id", "name", "status", "date_from", "date_till", "date_published")
			SELECT e.id, e.name,
				CASE WHEN e.status = 'public' AND e.report_published_at IS NOT NULL THEN 'public' ELSE 'draft' END,
				e.date_from, e.date_till,
				CASE WHEN e.status = 'public' AND e.report_published_at IS NOT NULL THEN e.report_published_at END
			FROM "events" e
			WHERE e.deleted_at IS NULL
				AND (COALESCE(btrim(e.public_report), '') <> '' OR e.chronicle_file_name IS NOT NULL)
				AND NOT EXISTS (SELECT 1 FROM "albums" a WHERE a.event_id = e.id)
		`);

		await queryRunner.query(`
			UPDATE "albums" a SET
				"description" = CASE
					WHEN COALESCE(btrim(e.public_report), '') = '' THEN a.description
					WHEN COALESCE(btrim(a.description), '') = '' THEN e.public_report
					WHEN position(btrim(e.public_report) IN a.description) > 0 THEN a.description
					ELSE a.description || E'\\n\\n' || e.public_report
				END,
				"chronicle_file_name" = e.chronicle_file_name,
				"chronicle_size" = e.chronicle_size,
				"chronicle_updated_at" = e.chronicle_updated_at
			FROM "events" e
			WHERE a.event_id = e.id
				AND (COALESCE(btrim(e.public_report), '') <> '' OR e.chronicle_file_name IS NOT NULL)
		`);

		const chronicles: { id: number; src_id: string | null; album_id: number }[] = await queryRunner.query(`
			SELECT e.id, e.src_id, a.id AS album_id
			FROM "events" e JOIN "albums" a ON a.event_id = e.id
			WHERE e.chronicle_file_name IS NOT NULL
		`);

		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "public_report"`);
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "chronicle_file_name"`);
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "chronicle_size"`);
		await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "chronicle_updated_at"`);

		for (const chronicle of chronicles) {
			await moveFile(eventChroniclePath(chronicle), albumChroniclePath(chronicle.album_id));
		}
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "events" ADD "chronicle_updated_at" TIMESTAMP WITH TIME ZONE`);
		await queryRunner.query(`ALTER TABLE "events" ADD "chronicle_size" integer`);
		await queryRunner.query(`ALTER TABLE "events" ADD "chronicle_file_name" character varying`);
		await queryRunner.query(`ALTER TABLE "events" ADD "public_report" text`);

		await queryRunner.query(`
			UPDATE "events" e SET
				"public_report" = NULLIF(btrim(a.description), ''),
				"chronicle_file_name" = a.chronicle_file_name,
				"chronicle_size" = a.chronicle_size,
				"chronicle_updated_at" = a.chronicle_updated_at
			FROM "albums" a
			WHERE a.event_id = e.id
		`);

		const chronicles: { id: number; src_id: string | null; album_id: number }[] = await queryRunner.query(`
			SELECT e.id, e.src_id, a.id AS album_id
			FROM "events" e JOIN "albums" a ON a.event_id = e.id
			WHERE a.chronicle_file_name IS NOT NULL
		`);

		await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "chronicle_updated_at"`);
		await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "chronicle_size"`);
		await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "chronicle_file_name"`);

		for (const chronicle of chronicles) {
			await moveFile(albumChroniclePath(chronicle.album_id), eventChroniclePath(chronicle));
		}
	}
}
