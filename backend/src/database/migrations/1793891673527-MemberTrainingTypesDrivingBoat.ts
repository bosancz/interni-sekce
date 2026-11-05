import { MigrationInterface, QueryRunner } from "typeorm";

export class MemberTrainingTypesDrivingBoat1793891673527 implements MigrationInterface {
	name = "MemberTrainingTypesDrivingBoat1793891673527";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TYPE "public"."members_trainings_type_enum" RENAME TO "members_trainings_type_enum_old"`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."members_trainings_type_enum" AS ENUM('zdravotnik', 'instruktorVodniTuristiky', 'lanac', 'vudceMalehoPlavidla', 'ridicskyPrukazB', 'ridicskyPrukazVlek', 'custom')`,
		);
		await queryRunner.query(
			`ALTER TABLE "members_trainings" ALTER COLUMN "type" TYPE "public"."members_trainings_type_enum" USING "type"::"text"::"public"."members_trainings_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."members_trainings_type_enum_old"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`UPDATE "members_trainings" SET "name" = CASE "type" WHEN 'vudceMalehoPlavidla' THEN 'Vůdce malého plavidla' WHEN 'ridicskyPrukazB' THEN 'Řidičský průkaz B' ELSE 'Řidičský průkaz na vlek (B96 a vyšší)' END, "type" = 'custom' WHERE "type" IN ('vudceMalehoPlavidla', 'ridicskyPrukazB', 'ridicskyPrukazVlek')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."members_trainings_type_enum_old" AS ENUM('zdravotnik', 'instruktorVodniTuristiky', 'lanac', 'custom')`,
		);
		await queryRunner.query(
			`ALTER TABLE "members_trainings" ALTER COLUMN "type" TYPE "public"."members_trainings_type_enum_old" USING "type"::"text"::"public"."members_trainings_type_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."members_trainings_type_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."members_trainings_type_enum_old" RENAME TO "members_trainings_type_enum"`,
		);
	}
}
