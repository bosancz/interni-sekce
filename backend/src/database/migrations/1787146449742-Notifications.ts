import { MigrationInterface, QueryRunner } from "typeorm";

export class Notifications1787146449742 implements MigrationInterface {
    name = 'Notifications1787146449742'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notification_subscriptions" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "device_id" character varying NOT NULL, "device_name" character varying, "endpoint" text NOT NULL, "key_p256dh" text NOT NULL, "key_auth" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f4da8f720344cbd05024cc3ae05" UNIQUE ("endpoint"), CONSTRAINT "UQ_f6cb6ad317f24789a4afde1cc72" UNIQUE ("user_id", "device_id"), CONSTRAINT "PK_8cfec5d2a549ff20d1f4e648226" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notification_settings_type_enum" AS ENUM('myEvents', 'submittedEvents', 'newEvents', 'newUsers')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_settings_channels_enum" AS ENUM('push', 'email', 'inApp')`);
        await queryRunner.query(`CREATE TABLE "notification_settings" ("user_id" integer NOT NULL, "type" "public"."notification_settings_type_enum" NOT NULL, "channels" "public"."notification_settings_channels_enum" array, CONSTRAINT "PK_ff98348bd5a8e07a7f3243a969c" PRIMARY KEY ("user_id", "type"))`);
        await queryRunner.query(`ALTER TABLE "notification_subscriptions" ADD CONSTRAINT "FK_565bddc96d2492c5bf99274575e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "notification_settings" ADD CONSTRAINT "FK_91a7ffebe8b406c4470845d4781" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification_settings" DROP CONSTRAINT "FK_91a7ffebe8b406c4470845d4781"`);
        await queryRunner.query(`ALTER TABLE "notification_subscriptions" DROP CONSTRAINT "FK_565bddc96d2492c5bf99274575e"`);
        await queryRunner.query(`DROP TABLE "notification_settings"`);
        await queryRunner.query(`DROP TYPE "public"."notification_settings_channels_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_settings_type_enum"`);
        await queryRunner.query(`DROP TABLE "notification_subscriptions"`);
    }

}
