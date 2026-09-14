import { MigrationInterface, QueryRunner } from "typeorm";

export class MemberHealthSeverity1781164329806 implements MigrationInterface {
	name = "MemberHealthSeverity1781164329806";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "members" ADD "allergies_new" jsonb`);
		await queryRunner.query(`
			UPDATE "members" m
			SET "allergies_new" = (
				SELECT jsonb_agg(jsonb_build_object('name', a, 'severity', 'medium'))
				FROM unnest(m."allergies") AS a
			)
			WHERE m."allergies" IS NOT NULL AND array_length(m."allergies", 1) > 0
		`);
		await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "allergies"`);
		await queryRunner.query(`ALTER TABLE "members" RENAME COLUMN "allergies_new" TO "allergies"`);

		await queryRunner.query(`ALTER TABLE "members" ADD "known_problems_new" jsonb`);
		await queryRunner.query(`
			UPDATE "members"
			SET "known_problems_new" = jsonb_build_array(jsonb_build_object('name', "known_problems", 'severity', 'medium'))
			WHERE "known_problems" IS NOT NULL AND btrim("known_problems") <> ''
		`);
		await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "known_problems"`);
		await queryRunner.query(`ALTER TABLE "members" RENAME COLUMN "known_problems_new" TO "known_problems"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "members" ADD "known_problems_old" text`);
		await queryRunner.query(`
			UPDATE "members" m
			SET "known_problems_old" = (
				SELECT string_agg(elem->>'name', E'\n')
				FROM jsonb_array_elements(m."known_problems") AS elem
			)
			WHERE m."known_problems" IS NOT NULL
		`);
		await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "known_problems"`);
		await queryRunner.query(`ALTER TABLE "members" RENAME COLUMN "known_problems_old" TO "known_problems"`);

		await queryRunner.query(`ALTER TABLE "members" ADD "allergies_old" character varying array`);
		await queryRunner.query(`
			UPDATE "members" m
			SET "allergies_old" = (
				SELECT array_agg(elem->>'name')
				FROM jsonb_array_elements(m."allergies") AS elem
			)
			WHERE m."allergies" IS NOT NULL
		`);
		await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "allergies"`);
		await queryRunner.query(`ALTER TABLE "members" RENAME COLUMN "allergies_old" TO "allergies"`);
	}
}
