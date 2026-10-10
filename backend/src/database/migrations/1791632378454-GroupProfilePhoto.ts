import { MigrationInterface, QueryRunner } from "typeorm";

export class GroupProfilePhoto1791632378454 implements MigrationInterface {
	name = "GroupProfilePhoto1791632378454";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "groups" ADD "profile_photo_updated_at" TIMESTAMP WITH TIME ZONE`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "profile_photo_updated_at"`);
	}
}
