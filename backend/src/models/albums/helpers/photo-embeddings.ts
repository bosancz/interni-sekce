export const PHOTO_EMBEDDING_DIMENSION = 512;

export const PHOTO_EMBEDDING_MODEL = "clip-vit-b32-crops-v2";

export function toVectorLiteral(values: ArrayLike<number>) {
	return `[${Array.from(values).join(",")}]`;
}

export function dot(a: ArrayLike<number>, b: ArrayLike<number>) {
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
