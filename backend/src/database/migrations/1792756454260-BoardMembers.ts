import { MigrationInterface, QueryRunner } from "typeorm";

export class BoardMembers1792756454260 implements MigrationInterface {
	name = "BoardMembers1792756454260";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "board_members" ("member_id" integer NOT NULL, "function" character varying NOT NULL, "position" integer, CONSTRAINT "PK_86b549e61bd934f2f654cc3bf04" PRIMARY KEY ("member_id"))`,
		);
		await queryRunner.query(
			`ALTER TABLE "board_members" ADD CONSTRAINT "FK_86b549e61bd934f2f654cc3bf04" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
		);
		await queryRunner.query(`
            INSERT INTO "board_members" ("member_id", "function", "position")
            SELECT m.id, d.function, d.position
            FROM (VALUES
                (0, 'Jára', 'hlavní vedoucí'),
                (1, 'Tyčka', 'hospodář'),
                (2, 'Máša', 'člen vedení'),
                (3, 'Fíla', 'člen vedení'),
                (4, 'Šumák', 'člen vedení'),
                (5, 'Pašík', 'člen vedení'),
                (6, 'Vokurka', 'člen vedení'),
                (7, 'Mazák', 'revizor'),
                (8, 'Žabiš', 'mluvčí za KONDOR')
            ) AS d(position, nickname, function)
            JOIN "members" m ON m.id = (
                SELECT min(mm.id) FROM "members" mm
                WHERE mm.deleted_at IS NULL AND lower(mm.nickname) = lower(d.nickname)
                HAVING count(*) = 1
            )
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "board_members" DROP CONSTRAINT "FK_86b549e61bd934f2f654cc3bf04"`);
		await queryRunner.query(`DROP TABLE "board_members"`);
	}
}
