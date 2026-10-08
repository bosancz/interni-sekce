import {
	bufferToHalves,
	decodeEmbedding,
	encodeEmbedding,
	encodeHalfEmbeddings,
	fromHalf,
	halvesToBuffer,
	meanEmbedding,
	PhotoVectorIndex,
	toHalf,
} from "./photo-embeddings";

function unit(values: number[], dimension = 4) {
	const vector = [...values, ...new Array(dimension - values.length).fill(0)];
	const norm = Math.hypot(...vector);
	return vector.map((value) => value / norm);
}

function halves(vectors: number[][], dimension = 4) {
	const result = new Uint16Array(vectors.length * dimension);
	vectors.forEach((vector, row) => vector.forEach((value, i) => (result[row * dimension + i] = toHalf(value))));
	return result;
}

describe("photo embeddings", () => {
	it("round-trips a float32 vector through bytea", () => {
		const values = [0.25, -0.5, 0.125, 1];
		expect(Array.from(decodeEmbedding(encodeEmbedding(values)))).toEqual(values);
	});

	it("stores half precision with negligible error", () => {
		for (const value of [0, 1, -1, 0.5, 0.0441, -0.0123, 0.00031, 1e-6, 0.999]) {
			expect(Math.abs(fromHalf(toHalf(value)) - value)).toBeLessThanOrEqual(
				Math.max(Math.abs(value) / 1024, 6e-8),
			);
		}
	});

	it("keeps dot products of normalised 512d vectors within 1e-4", () => {
		const random = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
		const next = random(42);
		const normalise = (vector: number[]) => {
			const norm = Math.hypot(...vector);
			return vector.map((value) => value / norm);
		};
		const a = normalise(Array.from({ length: 512 }, next));
		const b = normalise(Array.from({ length: 512 }, next));

		const exact = a.reduce((sum, value, i) => sum + value * b[i], 0);
		const half = bufferToHalves(halvesToBuffer(encodeHalfEmbeddings([a])));
		const approx = b.reduce((sum, value, i) => sum + value * fromHalf(half[i]), 0);

		expect(Math.abs(exact - approx)).toBeLessThan(1e-4);
	});
});

describe("PhotoVectorIndex", () => {
	const query = Float32Array.from(unit([1, 0]));

	function index() {
		const result = new PhotoVectorIndex(4, 2);
		result.set(1, halves([unit([1, 0])]));
		result.set(2, halves([unit([0, 1])]));
		result.set(3, halves([unit([0, 1]), unit([0.8, 0.6])]));
		result.set(4, halves([unit([-1, 0])]));
		result.set(5, halves([unit([0.6, 0.8]), unit([0, 1])]));
		return result;
	}

	it("scores a photo by its best crop", () => {
		expect(index().score(3, query)).toBeCloseTo(0.8, 3);
		expect(index().score(99, query)).toBeNull();
	});

	it("returns the best photos in descending order", () => {
		const hits = index().top(query, 3);

		expect(hits.map((hit) => hit.photoId)).toEqual([1, 3, 5]);
		expect(hits[1].score).toBeCloseTo(0.8, 3);
	});

	it("drops photos below the minimum score and counts the rest", () => {
		expect(
			index()
				.top(query, 10, 0.5)
				.map((hit) => hit.photoId),
		).toEqual([1, 3, 5]);
		expect(index().count(query, 0.7)).toBe(2);
	});

	it("replaces and deletes photos, compacting dead rows", () => {
		const result = index();
		result.set(1, halves([unit([0, 1])]));
		result.delete(3);
		for (let photoId = 10; photoId < 20; photoId++) result.set(photoId, halves([unit([0, 0, 1])]));

		expect(result.size).toBe(14);
		expect(result.rowCount).toBe(15);
		expect(result.top(query, 1).map((hit) => hit.photoId)).toEqual([5]);
		expect(result.score(1, query)).toBeCloseTo(0, 3);
		expect(result.score(3, query)).toBeNull();
		expect(result.score(19, query)).toBeCloseTo(0, 3);
	});
});

describe("meanEmbedding", () => {
	it("averages and normalises the vectors", () => {
		const mean = meanEmbedding([
			[1, 0],
			[0, 1],
		]);

		expect(mean[0]).toBeCloseTo(Math.SQRT1_2);
		expect(mean[1]).toBeCloseTo(Math.SQRT1_2);
	});

	it("returns an empty vector for no input", () => {
		expect(meanEmbedding([])).toEqual([]);
	});
});
