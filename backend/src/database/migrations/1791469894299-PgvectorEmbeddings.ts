import { MigrationInterface, QueryRunner } from "typeorm";

const PHOTO_EMBEDDING_DIMENSION = 512;
const FACE_DESCRIPTOR_DIMENSION = 128;
const CHUNK = 2000;

export class PgvectorEmbeddings1791469894299 implements MigrationInterface {
	name = "PgvectorEmbeddings1791469894299";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "vector"`);

		await queryRunner.query(
			`ALTER TABLE "photo_faces" ALTER COLUMN "descriptor" TYPE vector(${FACE_DESCRIPTOR_DIMENSION})
			USING CASE WHEN array_length("descriptor", 1) = ${FACE_DESCRIPTOR_DIMENSION} THEN "descriptor"::vector(${FACE_DESCRIPTOR_DIMENSION}) END`,
		);

		await queryRunner.query(
			`ALTER TABLE "photo_embeddings" ADD "embedding_vector" halfvec(${PHOTO_EMBEDDING_DIMENSION})`,
		);
		await convertRows(
			queryRunner,
			`SELECT photo_id AS "id", crop AS "crop", embedding AS "value" FROM photo_embeddings
			WHERE embedding IS NOT NULL AND (photo_id, crop) > ($1, $2) ORDER BY photo_id, crop LIMIT ${CHUNK}`,
			`UPDATE photo_embeddings e SET embedding_vector = v.value::halfvec(${PHOTO_EMBEDDING_DIMENSION})
			FROM unnest($1::int[], $2::smallint[], $3::text[]) AS v(id, crop, value)
			WHERE e.photo_id = v.id AND e.crop = v.crop`,
			(value: Buffer) => halfBufferToVector(value),
		);
		await queryRunner.query(`ALTER TABLE "photo_embeddings" DROP COLUMN "embedding"`);
		await queryRunner.query(`ALTER TABLE "photo_embeddings" RENAME COLUMN "embedding_vector" TO "embedding"`);

		await queryRunner.query(
			`ALTER TABLE "photo_categories" ADD "embedding_vector" vector(${PHOTO_EMBEDDING_DIMENSION})`,
		);
		await convertRows(
			queryRunner,
			`SELECT id AS "id", 0 AS "crop", embedding AS "value" FROM photo_categories
			WHERE embedding IS NOT NULL AND (id, 0) > ($1, $2) ORDER BY id LIMIT ${CHUNK}`,
			`UPDATE photo_categories c SET embedding_vector = v.value::vector(${PHOTO_EMBEDDING_DIMENSION})
			FROM unnest($1::int[], $2::smallint[], $3::text[]) AS v(id, crop, value)
			WHERE c.id = v.id`,
			(value: Buffer) => floatBufferToVector(value),
		);
		await queryRunner.query(`ALTER TABLE "photo_categories" DROP COLUMN "embedding"`);
		await queryRunner.query(`ALTER TABLE "photo_categories" RENAME COLUMN "embedding_vector" TO "embedding"`);

		await queryRunner.query(`CREATE INDEX "IDX_ad00f96563219eb5a9a507f70d" ON "photo_faces" ("photo_id") `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_ad00f96563219eb5a9a507f70d"`);

		await queryRunner.query(`ALTER TABLE "photo_categories" ADD "embedding_bytes" bytea`);
		await convertRows(
			queryRunner,
			`SELECT id AS "id", 0 AS "crop", embedding::text AS "value" FROM photo_categories
			WHERE embedding IS NOT NULL AND (id, 0) > ($1, $2) ORDER BY id LIMIT ${CHUNK}`,
			`UPDATE photo_categories c SET embedding_bytes = v.value
			FROM unnest($1::int[], $2::smallint[], $3::bytea[]) AS v(id, crop, value)
			WHERE c.id = v.id`,
			(value: string) => vectorToFloatBuffer(value),
		);
		await queryRunner.query(`ALTER TABLE "photo_categories" DROP COLUMN "embedding"`);
		await queryRunner.query(`ALTER TABLE "photo_categories" RENAME COLUMN "embedding_bytes" TO "embedding"`);

		await queryRunner.query(`ALTER TABLE "photo_embeddings" ADD "embedding_bytes" bytea`);
		await convertRows(
			queryRunner,
			`SELECT photo_id AS "id", crop AS "crop", embedding::text AS "value" FROM photo_embeddings
			WHERE embedding IS NOT NULL AND (photo_id, crop) > ($1, $2) ORDER BY photo_id, crop LIMIT ${CHUNK}`,
			`UPDATE photo_embeddings e SET embedding_bytes = v.value
			FROM unnest($1::int[], $2::smallint[], $3::bytea[]) AS v(id, crop, value)
			WHERE e.photo_id = v.id AND e.crop = v.crop`,
			(value: string) => vectorToHalfBuffer(value),
		);
		await queryRunner.query(`ALTER TABLE "photo_embeddings" DROP COLUMN "embedding"`);
		await queryRunner.query(`ALTER TABLE "photo_embeddings" RENAME COLUMN "embedding_bytes" TO "embedding"`);

		await queryRunner.query(
			`ALTER TABLE "photo_faces" ALTER COLUMN "descriptor" TYPE real array USING "descriptor"::real[]`,
		);

		await queryRunner.query(`DROP EXTENSION IF EXISTS "vector"`);
	}
}

async function convertRows<T, R>(queryRunner: QueryRunner, select: string, update: string, convert: (value: T) => R) {
	let last = [-1, -1];
	while (true) {
		const rows: { id: number; crop: number; value: T }[] = await queryRunner.query(select, last);
		if (!rows.length) return;

		await queryRunner.query(update, [
			rows.map((row) => row.id),
			rows.map((row) => row.crop),
			rows.map((row) => convert(row.value)),
		]);

		const { id, crop } = rows[rows.length - 1];
		last = [id, crop];
	}
}

function halfBufferToVector(buffer: Buffer) {
	const values: string[] = [];
	for (let i = 0; i + 1 < buffer.length; i += 2) {
		const value = fromHalf(buffer.readUInt16LE(i));
		values.push(Object.is(value, -0) ? "-0" : value.toPrecision(5));
	}
	return `[${values.join(",")}]`;
}

function floatBufferToVector(buffer: Buffer) {
	const values: number[] = [];
	for (let i = 0; i + 3 < buffer.length; i += 4) values.push(buffer.readFloatLE(i));
	return `[${values.join(",")}]`;
}

function parseVector(value: string) {
	return value.slice(1, -1).split(",").map(Number);
}

function vectorToHalfBuffer(value: string) {
	const values = parseVector(value);
	const buffer = Buffer.alloc(values.length * 2);
	values.forEach((v, i) => buffer.writeUInt16LE(toHalf(v), i * 2));
	return buffer;
}

function vectorToFloatBuffer(value: string) {
	const values = parseVector(value);
	const buffer = Buffer.alloc(values.length * 4);
	values.forEach((v, i) => buffer.writeFloatLE(v, i * 4));
	return buffer;
}

function fromHalf(bits: number) {
	const sign = bits & 0x8000 ? -1 : 1;
	const exponent = (bits >> 10) & 0x1f;
	const fraction = bits & 0x3ff;
	if (exponent === 0) return sign * 2 ** -14 * (fraction / 1024);
	if (exponent === 31) return fraction ? NaN : sign * Infinity;
	return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
}

function toHalf(value: number) {
	const floatView = new Float32Array([value]);
	const bits = new Uint32Array(floatView.buffer)[0];
	const sign = (bits >>> 16) & 0x8000;
	const exponent = ((bits >>> 23) & 0xff) - 127 + 15;
	const mantissa = bits & 0x7fffff;

	if (exponent >= 31) return sign | 0x7c00;
	if (exponent <= 0) {
		if (exponent < -10) return sign;
		const shifted = (mantissa | 0x800000) >> (1 - exponent);
		return sign | ((shifted + 0x1000) >> 13);
	}

	return (sign | (exponent << 10) | (mantissa >> 13)) + ((mantissa >> 12) & 1);
}
