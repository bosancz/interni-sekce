import { pickInsuranceCardExpiration } from "./insurance-card-expiration";

const today = "2026-10-17";

describe("pickInsuranceCardExpiration", () => {
	it("takes the later of the birth date and the expiration", () => {
		expect(pickInsuranceCardExpiration(["2012-03-14", "2030-12-31"], null, today)).toBe("2030-12-31");
		expect(pickInsuranceCardExpiration(["2030-12-31", "2012-03-14"], null, today)).toBe("2030-12-31");
	});

	it("keeps an expiration that has already passed", () => {
		expect(pickInsuranceCardExpiration(["2012-03-14", "2025-06-30"], "2012-03-14", today)).toBe("2025-06-30");
	});

	it("drops the known birthday instead of the earliest date", () => {
		expect(pickInsuranceCardExpiration(["2001-01-01", "2012-03-14", "2030-12-31"], "2012-03-14", today)).toBe(
			"2030-12-31",
		);
	});

	it("accepts a lone date only in the future and not equal to the birthday", () => {
		expect(pickInsuranceCardExpiration(["2030-12-31"], null, today)).toBe("2030-12-31");
		expect(pickInsuranceCardExpiration(["2012-03-14"], null, today)).toBeNull();
		expect(pickInsuranceCardExpiration(["2030-12-31"], "2030-12-31", today)).toBeNull();
	});

	it("rejects an expiration before the birthday", () => {
		expect(pickInsuranceCardExpiration(["2001-01-01", "2005-01-01"], "2012-03-14", today)).toBeNull();
	});

	it("returns null without dates", () => {
		expect(pickInsuranceCardExpiration([], "2012-03-14", today)).toBeNull();
	});
});
