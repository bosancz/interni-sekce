import { MigrationInterface, QueryRunner } from "typeorm";

export class ContactsRefactor1706967536277 implements MigrationInterface {
  name = "ContactsRefactor1706967536277";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "members_contacts" DROP COLUMN "contact"`);
    await queryRunner.query(`ALTER TABLE "members_contacts" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."members_contacts_type_enum"`);
    await queryRunner.query(`ALTER TABLE "members_contacts" ADD "mobile" character varying`);
    await queryRunner.query(`ALTER TABLE "members_contacts" ADD "email" character varying`);
    await queryRunner.query(`ALTER TABLE "members_contacts" ADD "other" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "members_contacts" DROP COLUMN "other"`);
    await queryRunner.query(`ALTER TABLE "members_contacts" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "members_contacts" DROP COLUMN "mobile"`);
    await queryRunner.query(`CREATE TYPE "public"."members_contacts_type_enum" AS ENUM('mobile', 'email', 'other')`);
    await queryRunner.query(`ALTER TABLE "members_contacts" ADD "type" "public"."members_contacts_type_enum" NOT NULL`);
    await queryRunner.query(`ALTER TABLE "members_contacts" ADD "contact" character varying NOT NULL`);
  }
}
