import { DateTime } from "luxon";
import { formatBirthdaysBody, formatYears, getBirthdayDays } from "./birthdays";

describe("getBirthdayDays", () => {
	it("takes the day itself", () => {
		expect(getBirthdayDays(DateTime.fromISO("2026-11-13"))).toEqual({ month: 11, days: [13] });
	});

	it("celebrates 29 February on 28 February outside leap years", () => {
		expect(getBirthdayDays(DateTime.fromISO("2027-02-28"))).toEqual({ month: 2, days: [28, 29] });
		expect(getBirthdayDays(DateTime.fromISO("2028-02-28"))).toEqual({ month: 2, days: [28] });
		expect(getBirthdayDays(DateTime.fromISO("2028-02-29"))).toEqual({ month: 2, days: [29] });
	});
});

describe("formatYears", () => {
	it("declines the Czech word for years", () => {
		expect(formatYears(1)).toBe("1 rok");
		expect(formatYears(3)).toBe("3 roky");
		expect(formatYears(11)).toBe("11 let");
	});
});

describe("formatBirthdaysBody", () => {
	const date = DateTime.fromISO("2026-11-13");

	it("names one member with their age", () => {
		expect(formatBirthdaysBody([{ id: 1, nickname: "Bilbo", birthday: "1915-11-13" }], date)).toBe(
			"Dnes slaví Bilbo (111 let).",
		);
	});

	it("lists more members and falls back to the name", () => {
		expect(
			formatBirthdaysBody(
				[
					{ id: 1, nickname: "Pipin", birthday: "2014-11-13" },
					{ id: 2, nickname: null, firstName: "Smíšek", lastName: "Brandorád", birthday: "2016-11-13" },
					{ id: 3, nickname: "Frodo", birthday: "2022-11-13" },
				],
				date,
			),
		).toBe("Dnes slaví Pipin (12 let), Smíšek Brandorád (10 let) a Frodo (4 roky).");
	});
});
