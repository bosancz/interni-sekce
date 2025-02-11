import { MigrationInterface, QueryRunner } from "typeorm";

export class fixTypes1671535049154 implements MigrationInterface {
    name = 'fixTypes1671535049154'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "members_achievements" DROP COLUMN "type"`);
        await queryRunner.query(`CREATE TYPE "public"."members_achievements_type_enum" AS ENUM('star', 'certificate', 'other')`);
        await queryRunner.query(`ALTER TABLE "members_achievements" ADD "type" "public"."members_achievements_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "members_contacts" DROP COLUMN "type"`);
        await queryRunner.query(`CREATE TYPE "public"."members_contacts_type_enum" AS ENUM('mobile', 'email', 'other')`);
        await queryRunner.query(`ALTER TABLE "members_contacts" ADD "type" "public"."members_contacts_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "role"`);
        await queryRunner.query(`CREATE TYPE "public"."members_role_enum" AS ENUM('clen', 'vedouci')`);
        await queryRunner.query(`ALTER TABLE "members" ADD "role" "public"."members_role_enum"`);
        await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "rank"`);
        await queryRunner.query(`CREATE TYPE "public"."members_rank_enum" AS ENUM('dite', 'instruktor', 'vedouci')`);
        await queryRunner.query(`ALTER TABLE "members" ADD "rank" "public"."members_rank_enum"`);
        await queryRunner.query(`ALTER TABLE "events_attendees" DROP COLUMN "type"`);
        await queryRunner.query(`CREATE TYPE "public"."events_attendees_type_enum" AS ENUM('attendee', 'leader')`);
        await queryRunner.query(`ALTER TABLE "events_attendees" ADD "type" "public"."events_attendees_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."events_status_enum" AS ENUM('draft', 'pending', 'public', 'cancelled', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "events" ADD "status" "public"."events_status_enum" NOT NULL DEFAULT 'draft'`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "date_from"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "date_from" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "date_till"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "date_till" date NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "date_till"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "date_till" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "date_from"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "date_from" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."events_status_enum"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "status" character varying NOT NULL DEFAULT 'draft'`);
        await queryRunner.query(`ALTER TABLE "events_attendees" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."events_attendees_type_enum"`);
        await queryRunner.query(`ALTER TABLE "events_attendees" ADD "type" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "rank"`);
        await queryRunner.query(`DROP TYPE "public"."members_rank_enum"`);
        await queryRunner.query(`ALTER TABLE "members" ADD "rank" character varying`);
        await queryRunner.query(`ALTER TABLE "members" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."members_role_enum"`);
        await queryRunner.query(`ALTER TABLE "members" ADD "role" character varying`);
        await queryRunner.query(`ALTER TABLE "members_contacts" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."members_contacts_type_enum"`);
        await queryRunner.query(`ALTER TABLE "members_contacts" ADD "type" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "members_achievements" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."members_achievements_type_enum"`);
        await queryRunner.query(`ALTER TABLE "members_achievements" ADD "type" character varying NOT NULL`);
    }

}
