import { MigrationInterface, QueryRunner } from "typeorm";

export class memberContactCascadeDelete1674840832100 implements MigrationInterface {
    name = 'memberContactCascadeDelete1674840832100'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "members_contacts" DROP CONSTRAINT "FK_b9715a4794b658fb0bec2698f40"`);
        await queryRunner.query(`ALTER TABLE "members_contacts" ADD CONSTRAINT "FK_b9715a4794b658fb0bec2698f40" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "members_contacts" DROP CONSTRAINT "FK_b9715a4794b658fb0bec2698f40"`);
        await queryRunner.query(`ALTER TABLE "members_contacts" ADD CONSTRAINT "FK_b9715a4794b658fb0bec2698f40" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    }

}
