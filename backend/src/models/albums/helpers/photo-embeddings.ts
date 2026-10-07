import { PhotoSearchHit } from "../schema/photo-embeddings";

export const PHOTO_EMBEDDING_DIMENSION = 512;

const HALF_TO_FLOAT = (() => {
	const table = new Float32Array(65536);
	for (let bits = 0; bits < 65536; bits++) {
		const sign = bits & 0x8000 ? -1 : 1;
		const exponent = (bits >> 10) & 0x1f;
		const fraction = bits & 0x3ff;
		if (exponent === 0) table[bits] = sign * 2 ** -14 * (fraction / 1024);
		else if (exponent === 31) table[bits] = fraction ? NaN : sign * Infinity;
		else table[bits] = sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
	}
	return table;
})();

const floatView = new Float32Array(1);
const intView = new Uint32Array(floatView.buffer);

export function toHalf(value: number) {
	floatView[0] = value;
	const bits = intView[0];
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

export function fromHalf(bits: number) {
	return HALF_TO_FLOAT[bits];
}

export function encodeHalfEmbeddings(vectors: number[][]) {
	const halves = new Uint16Array(vectors.length * PHOTO_EMBEDDING_DIMENSION);
	vectors.forEach((vector, row) => {
		for (let i = 0; i < PHOTO_EMBEDDING_DIMENSION; i++)
			halves[row * PHOTO_EMBEDDING_DIMENSION + i] = toHalf(vector[i]);
	});
	return halves;
}

export function halvesToBuffer(halves: Uint16Array) {
	return Buffer.from(halves.buffer, halves.byteOffset, halves.byteLength);
}

export function bufferToHalves(buffer: Buffer) {
	const copy = new Uint8Array(buffer.byteLength);
	copy.set(buffer);
	return new Uint16Array(copy.buffer);
}

export function encodeEmbedding(values: number[]) {
	const vector = Float32Array.from(values);
	return Buffer.from(vector.buffer, vector.byteOffset, vector.byteLength);
}

export function decodeEmbedding(buffer: Buffer) {
	const copy = new Uint8Array(buffer.byteLength);
	copy.set(buffer);
	return new Float32Array(copy.buffer);
}

export function dot(a: Float32Array, b: Float32Array) {
	let sum = 0;
	const length = Math.min(a.length, b.length);
	for (let i = 0; i < length; i++) sum += a[i] * b[i];
	return sum;
}

export function meanEmbedding(vectors: number[][]) {
	const length = vectors[0]?.length ?? 0;
	const mean = new Float32Array(length);
	for (const vector of vectors) for (let i = 0; i < length; i++) mean[i] += vector[i];

	const norm = Math.sqrt(dot(mean, mean));
	if (norm > 0) for (let i = 0; i < length; i++) mean[i] /= norm;

	return Array.from(mean);
}

export class PhotoVectorIndex {
	private data: Uint16Array;
	private rowPhoto: Int32Array;
	private rows = 0;
	private deadRows = 0;
	private photos = new Map<number, { start: number; count: number }>();

	constructor(
		readonly dimension = PHOTO_EMBEDDING_DIMENSION,
		capacity = 1024,
	) {
		this.data = new Uint16Array(capacity * dimension);
		this.rowPhoto = new Int32Array(capacity);
	}

	get size() {
		return this.photos.size;
	}

	get rowCount() {
		return this.rows - this.deadRows;
	}

	has(photoId: number) {
		return this.photos.has(photoId);
	}

	set(photoId: number, halves: Uint16Array) {
		this.delete(photoId);

		const count = Math.floor(halves.length / this.dimension);
		if (!count) return;

		this.reserve(count);
		this.data.set(halves.subarray(0, count * this.dimension), this.rows * this.dimension);
		this.rowPhoto.fill(photoId, this.rows, this.rows + count);
		this.photos.set(photoId, { start: this.rows, count });
		this.rows += count;
	}

	delete(photoId: number) {
		const entry = this.photos.get(photoId);
		if (!entry) return;

		this.rowPhoto.fill(-1, entry.start, entry.start + entry.count);
		this.deadRows += entry.count;
		this.photos.delete(photoId);
	}

	score(photoId: number, query: Float32Array) {
		const entry = this.photos.get(photoId);
		if (!entry) return null;

		let best = -Infinity;
		for (let row = entry.start; row < entry.start + entry.count; row++)
			best = Math.max(best, this.rowScore(row, query));
		return best;
	}

	top(query: Float32Array, limit: number, minScore = -Infinity) {
		const hits: PhotoSearchHit[] = [];
		this.forEachPhoto(query, (photoId, score) => {
			if (score < minScore) return;
			if (hits.length < limit) {
				hits.push({ photoId, score });
				if (hits.length === limit) hits.sort((a, b) => b.score - a.score);
			} else if (score > hits[limit - 1].score) {
				let i = limit - 1;
				while (i > 0 && hits[i - 1].score < score) {
					hits[i] = hits[i - 1];
					i--;
				}
				hits[i] = { photoId, score };
			}
		});

		return hits.sort((a, b) => b.score - a.score);
	}

	count(query: Float32Array, minScore: number) {
		let count = 0;
		this.forEachPhoto(query, (_, score) => {
			if (score >= minScore) count++;
		});
		return count;
	}

	private forEachPhoto(query: Float32Array, callback: (photoId: number, score: number) => void) {
		let currentPhoto = -1;
		let best = -Infinity;

		for (let row = 0; row < this.rows; row++) {
			const photoId = this.rowPhoto[row];
			if (photoId < 0) continue;
			if (photoId !== currentPhoto) {
				if (currentPhoto >= 0) callback(currentPhoto, best);
				currentPhoto = photoId;
				best = -Infinity;
			}
			const score = this.rowScore(row, query);
			if (score > best) best = score;
		}

		if (currentPhoto >= 0) callback(currentPhoto, best);
	}

	private rowScore(row: number, query: Float32Array) {
		const data = this.data;
		const offset = row * this.dimension;
		let sum = 0;
		for (let i = 0; i < this.dimension; i++) sum += query[i] * HALF_TO_FLOAT[data[offset + i]];
		return sum;
	}

	private reserve(count: number) {
		if (this.rows + count <= this.rowPhoto.length) return;

		if (this.deadRows > this.rows / 4) this.compact();
		if (this.rows + count <= this.rowPhoto.length) return;

		const capacity = Math.max(this.rowPhoto.length * 2, this.rows + count);
		const data = new Uint16Array(capacity * this.dimension);
		data.set(this.data.subarray(0, this.rows * this.dimension));
		const rowPhoto = new Int32Array(capacity);
		rowPhoto.set(this.rowPhoto.subarray(0, this.rows));
		this.data = data;
		this.rowPhoto = rowPhoto;
	}

	private compact() {
		let target = 0;
		for (const entry of this.photos.values()) {
			if (entry.start !== target) {
				this.data.copyWithin(
					target * this.dimension,
					entry.start * this.dimension,
					(entry.start + entry.count) * this.dimension,
				);
			}
			entry.start = target;
			target += entry.count;
		}

		this.rowPhoto.fill(-1);
		for (const [photoId, entry] of this.photos) this.rowPhoto.fill(photoId, entry.start, entry.start + entry.count);
		this.rows = target;
		this.deadRows = 0;
	}
}
