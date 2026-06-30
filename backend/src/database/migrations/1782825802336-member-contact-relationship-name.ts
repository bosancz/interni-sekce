import { MigrationInterface, QueryRunner } from "typeorm";

export class MemberContactRelationshipName1782825802336 implements MigrationInterface {
	name = "MemberContactRelationshipName1782825802336";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "members_contacts" RENAME COLUMN "title" TO "relationship"`);
		await queryRunner.query(`ALTER TABLE "members_contacts" ADD "name" character varying`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "members_contacts" DROP COLUMN "name"`);
		await queryRunner.query(`ALTER TABLE "members_contacts" RENAME COLUMN "relationship" TO "title"`);
	}
}
