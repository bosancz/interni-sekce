import { MigrationInterface, QueryRunner } from "typeorm";

export class albumsAndFixes1671533509152 implements MigrationInterface {
    name = 'albumsAndFixes1671533509152'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "members_achievements" DROP CONSTRAINT "FK_63632e7c980cb943c61c14aa17f"`);
        await queryRunner.query(`ALTER TABLE "members_contacts" DROP CONSTRAINT "FK_b9715a4794b658fb0bec2698f40"`);
        await queryRunner.query(`ALTER TABLE "events_attendees" DROP CONSTRAINT "FK_370541e98297da9d2055977a2b2"`);
        await queryRunner.query(`ALTER TABLE "events_attendees" DROP CONSTRAINT "FK_66d88c4938cd79dac741ddf846d"`);
        await queryRunner.query(`ALTER TABLE "events_expenses" DROP CONSTRAINT "FK_28edbab9122c71c02cdf14ed108"`);
        await queryRunner.query(`ALTER TABLE "events_groups" DROP CONSTRAINT "FK_a6aeb17233427f9165e96614484"`);
        await queryRunner.query(`ALTER TABLE "events_groups" DROP CONSTRAINT "FK_3f8a06930c4defd0f60ae9bf30d"`);
        await queryRunner.query(`CREATE TABLE "photos" ("id" SERIAL NOT NULL, "album_id" integer NOT NULL, "title" text NOT NULL, "name" text NOT NULL, "caption" text NOT NULL, "width" integer NOT NULL, "height" integer NOT NULL, "date" TIMESTAMP WITH TIME ZONE NOT NULL, "tags" character varying array NOT NULL, "bg" character varying NOT NULL, "albumId" integer, CONSTRAINT "PK_5220c45b8e32d49d767b9b3d725" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "albums" ("id" SERIAL NOT NULL, "status" character varying NOT NULL DEFAULT 'draft', "name" character varying NOT NULL, "year" integer NOT NULL, "description" text NOT NULL, "date_published" TIMESTAMP WITH TIME ZONE NOT NULL, "date_from" date NOT NULL, "date_till" date NOT NULL, CONSTRAINT "PK_838ebae24d2e12082670ffc95d7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "events" ADD "album_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "UQ_ca57b2c41c774ad0a89d3a74c61" UNIQUE ("album_id")`);
        await queryRunner.query(`ALTER TABLE "members_achievements" ADD CONSTRAINT "FK_63632e7c980cb943c61c14aa17f" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "members_contacts" ADD CONSTRAINT "FK_b9715a4794b658fb0bec2698f40" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_attendees" ADD CONSTRAINT "FK_370541e98297da9d2055977a2b2" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_attendees" ADD CONSTRAINT "FK_66d88c4938cd79dac741ddf846d" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_expenses" ADD CONSTRAINT "FK_28edbab9122c71c02cdf14ed108" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD CONSTRAINT "FK_a6aeb17233427f9165e96614484" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD CONSTRAINT "FK_0593cf7f0f7560db1b5ad7a6f31" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_ca57b2c41c774ad0a89d3a74c61" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "photos" ADD CONSTRAINT "FK_f012e62aaf25a8210ed0d935f0e" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "photos" DROP CONSTRAINT "FK_f012e62aaf25a8210ed0d935f0e"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_ca57b2c41c774ad0a89d3a74c61"`);
        await queryRunner.query(`ALTER TABLE "events_groups" DROP CONSTRAINT "FK_0593cf7f0f7560db1b5ad7a6f31"`);
        await queryRunner.query(`ALTER TABLE "events_groups" DROP CONSTRAINT "FK_a6aeb17233427f9165e96614484"`);
        await queryRunner.query(`ALTER TABLE "events_expenses" DROP CONSTRAINT "FK_28edbab9122c71c02cdf14ed108"`);
        await queryRunner.query(`ALTER TABLE "events_attendees" DROP CONSTRAINT "FK_66d88c4938cd79dac741ddf846d"`);
        await queryRunner.query(`ALTER TABLE "events_attendees" DROP CONSTRAINT "FK_370541e98297da9d2055977a2b2"`);
        await queryRunner.query(`ALTER TABLE "members_contacts" DROP CONSTRAINT "FK_b9715a4794b658fb0bec2698f40"`);
        await queryRunner.query(`ALTER TABLE "members_achievements" DROP CONSTRAINT "FK_63632e7c980cb943c61c14aa17f"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "UQ_ca57b2c41c774ad0a89d3a74c61"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "album_id"`);
        await queryRunner.query(`DROP TABLE "albums"`);
        await queryRunner.query(`DROP TABLE "photos"`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD CONSTRAINT "FK_3f8a06930c4defd0f60ae9bf30d" FOREIGN KEY ("group_id", "group_id") REFERENCES "events_groups"("event_id","group_id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_groups" ADD CONSTRAINT "FK_a6aeb17233427f9165e96614484" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_expenses" ADD CONSTRAINT "FK_28edbab9122c71c02cdf14ed108" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_attendees" ADD CONSTRAINT "FK_66d88c4938cd79dac741ddf846d" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "events_attendees" ADD CONSTRAINT "FK_370541e98297da9d2055977a2b2" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "members_contacts" ADD CONSTRAINT "FK_b9715a4794b658fb0bec2698f40" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "members_achievements" ADD CONSTRAINT "FK_63632e7c980cb943c61c14aa17f" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

}
