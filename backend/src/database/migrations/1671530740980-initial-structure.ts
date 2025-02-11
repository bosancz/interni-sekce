import { MigrationInterface, QueryRunner } from "typeorm";

export class initialStructure1671530740980 implements MigrationInterface {
    name = 'initialStructure1671530740980'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "groups" ("id" SERIAL NOT NULL, CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "members_achievements" ("id" SERIAL NOT NULL, "member_id" integer NOT NULL, "type" character varying NOT NULL, "date_from" date, "date_till" date, CONSTRAINT "PK_26cd300187f5eaf96f313b1121c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "members_contacts" ("id" SERIAL NOT NULL, "member_id" integer NOT NULL, "title" character varying NOT NULL, "type" character varying NOT NULL, "contact" character varying NOT NULL, CONSTRAINT "PK_126c38c9de2a015b3d0f32bc88c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "members" ("id" SERIAL NOT NULL, "group_id" integer NOT NULL, "inactive" boolean NOT NULL DEFAULT false, "membership" boolean NOT NULL DEFAULT true, "role" character varying, "rank" character varying, "nickname" character varying, "function" character varying, "first_name" character varying, "last_name" character varying, "birthday" date, "address_street" character varying, "address_street_no" character varying, "address_city" character varying, "address_postal_code" character varying, "address_country" character varying, "mobile" character varying, "email" character varying, CONSTRAINT "PK_28b53062261b996d9c99fa12404" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "events_expenses" ("id" SERIAL NOT NULL, "event_id" integer NOT NULL, "label" character varying NOT NULL, "amount" numeric NOT NULL, "type" character varying NOT NULL, "description" text NOT NULL, CONSTRAINT "PK_95e778bfa197347499306a1ec24" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "events_groups" ("event_id" integer NOT NULL, "group_id" integer NOT NULL, CONSTRAINT "PK_3f4996f9f06ad47e98c6809e9be" PRIMARY KEY ("event_id", "group_id"))`);
        await queryRunner.query(`CREATE TABLE "events" ("id" SERIAL NOT NULL, "name" text NOT NULL, "status" character varying NOT NULL DEFAULT 'draft', "status_note" text NOT NULL, "place" text NOT NULL, "description" text NOT NULL, "date_from" TIMESTAMP NOT NULL, "date_till" TIMESTAMP NOT NULL, "time_from" character varying NOT NULL, "time_till" character varying NOT NULL, "meeting_place_start" character varying NOT NULL, "meeting_place_end" character varying NOT NULL, "type" character varying NOT NULL, "water_km" numeric NOT NULL, "river" character varying NOT NULL, CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "events_attendees" ("event_id" integer NOT NULL, "member_id" integer NOT NULL, "type" character varying NOT NULL, CONSTRAINT "PK_d38b569467870fc6267af27d161" PRIMARY KEY ("event_id", "member_id"))`);
        await queryRunner.query(`ALTER TABLE "members_achievements" ADD CONSTRAINT "FK_63632e7c980cb943c61c14aa17f" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "members_contacts" ADD CONSTRAINT "FK_b9715a4794b658fb0bec2698f40" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "members" ADD CONSTRAINT "FK_b9dc6083fb1fc597d2018a19e84" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_expenses" ADD CONSTRAINT "FK_28edbab9122c71c02cdf14ed108" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD CONSTRAINT "FK_a6aeb17233427f9165e96614484" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD CONSTRAINT "FK_3f8a06930c4defd0f60ae9bf30d" FOREIGN KEY ("group_id", "group_id") REFERENCES "events_groups"("event_id","group_id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_attendees" ADD CONSTRAINT "FK_370541e98297da9d2055977a2b2" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_attendees" ADD CONSTRAINT "FK_66d88c4938cd79dac741ddf846d" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events_attendees" DROP CONSTRAINT "FK_66d88c4938cd79dac741ddf846d"`);
        await queryRunner.query(`ALTER TABLE "events_attendees" DROP CONSTRAINT "FK_370541e98297da9d2055977a2b2"`);
        await queryRunner.query(`ALTER TABLE "events_groups" DROP CONSTRAINT "FK_3f8a06930c4defd0f60ae9bf30d"`);
        await queryRunner.query(`ALTER TABLE "events_groups" DROP CONSTRAINT "FK_a6aeb17233427f9165e96614484"`);
        await queryRunner.query(`ALTER TABLE "events_expenses" DROP CONSTRAINT "FK_28edbab9122c71c02cdf14ed108"`);
        await queryRunner.query(`ALTER TABLE "members" DROP CONSTRAINT "FK_b9dc6083fb1fc597d2018a19e84"`);
        await queryRunner.query(`ALTER TABLE "members_contacts" DROP CONSTRAINT "FK_b9715a4794b658fb0bec2698f40"`);
        await queryRunner.query(`ALTER TABLE "members_achievements" DROP CONSTRAINT "FK_63632e7c980cb943c61c14aa17f"`);
        await queryRunner.query(`DROP TABLE "events_attendees"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TABLE "events_groups"`);
        await queryRunner.query(`DROP TABLE "events_expenses"`);
        await queryRunner.query(`DROP TABLE "members"`);
        await queryRunner.query(`DROP TABLE "members_contacts"`);
        await queryRunner.query(`DROP TABLE "members_achievements"`);
        await queryRunner.query(`DROP TABLE "groups"`);
    }

}
