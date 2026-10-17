import { DateTime } from "luxon";
import { getExpiredBackups } from "./backup-retention";

const now = DateTime.fromISO("2026-10-17T04:00:00", { zone: "Europe/Prague" });

function daily(from: string, days: number) {
	const start = DateTime.fromISO(from, { zone: "Europe/Prague" });
	return Array.from({ length: days }, (_, i) => {
		const created = start.plus({ days: i }).toUTC().toISO()!;
		return { id: created, createdTime: created };
	});
}

describe("getExpiredBackups", () => {
	it("keeps recent daily backups and the first backup of each month", () => {
		const files = daily("2025-06-01T04:00:00", 504);
		const kept = new Set(files.map((f) => f.id));
		for (const file of getExpiredBackups(files, { now, keepDays: 30, keepMonths: 12 })) kept.delete(file.id);

		const keptDates = [...kept].map((id) => DateTime.fromISO(id).setZone("Europe/Prague").toISODate()).sort();

		expect(keptDates.filter((d) => d! < "2026-09-17")).toEqual([
			"2025-11-01",
			"2025-12-01",
			"2026-01-01",
			"2026-02-01",
			"2026-03-01",
			"2026-04-01",
			"2026-05-01",
			"2026-06-01",
			"2026-07-01",
			"2026-08-01",
			"2026-09-01",
		]);
		expect(keptDates.filter((d) => d! >= "2026-09-17")).toHaveLength(31);
		expect(keptDates).toContain("2026-10-01");
	});

	it("keeps a month's first backup even when it was not made on the 1st", () => {
		const files = [
			{ id: "a", createdTime: "2026-03-05T03:00:00Z" },
			{ id: "b", createdTime: "2026-03-06T03:00:00Z" },
		];
		expect(getExpiredBackups(files, { now, keepDays: 30, keepMonths: 12 }).map((f) => f.id)).toEqual(["b"]);
	});

	it("deletes everything outside the daily window when monthly backups are off", () => {
		const files = daily("2026-08-01T04:00:00", 78);
		const expired = getExpiredBackups(files, { now, keepDays: 30, keepMonths: 0 });
		expect(files.length - expired.length).toBe(31);
	});
});
