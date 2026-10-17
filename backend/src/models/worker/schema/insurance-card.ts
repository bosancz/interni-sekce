export interface ReadInsuranceCardJob {
	memberId: number;
	path: string;
}

export interface ReadInsuranceCardResult {
	model: string;
	dates: string[];
	error?: string;
}
