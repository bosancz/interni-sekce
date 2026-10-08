import { meanEmbedding, toVectorLiteral } from "./photo-embeddings";

describe("toVectorLiteral", () => {
	it("formats a pgvector literal that round-trips float32 values", () => {
		const values = Float32Array.from([0.25, -0.5, 0.1, 1e-7]);
		const parsed = Float32Array.from(toVectorLiteral(values).slice(1, -1).split(",").map(Number));

		expect(toVectorLiteral([1, -2])).toBe("[1,-2]");
		expect(Array.from(parsed)).toEqual(Array.from(values));
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
