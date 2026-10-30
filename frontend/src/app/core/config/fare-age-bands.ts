export interface FareAgeBand {
	from: number;
	till: number | null;
}

export const FareAgeBands: FareAgeBand[] = [
	{ from: 0, till: 5 },
	{ from: 6, till: 14 },
	{ from: 15, till: 17 },
	{ from: 18, till: 25 },
	{ from: 26, till: 64 },
	{ from: 65, till: null },
];
