import { DateTime } from "luxon";

export interface BackupFile {
	id: string;
	createdTime: string;
}

export function getExpiredBackups<T extends BackupFile>(
	files: T[],
	options: { now: DateTime; keepDays: number; keepMonths: number },
): T[] {
	const { now, keepDays, keepMonths } = options;

	const dailyFrom = now.minus({ days: keepDays });
	const monthlyFrom = now.startOf("month").minus({ months: keepMonths - 1 });

	const sorted = [...files].sort((a, b) => a.createdTime.localeCompare(b.createdTime));

	const keep = new Set<string>();
	const seenMonths = new Set<string>();

	for (const file of sorted) {
		const created = DateTime.fromISO(file.createdTime).setZone(now.zone);
		const month = created.toFormat("yyyy-MM");

		if (created >= dailyFrom) keep.add(file.id);

		if (!seenMonths.has(month)) {
			seenMonths.add(month);
			if (keepMonths > 0 && created >= monthlyFrom) keep.add(file.id);
		}
	}

	return files.filter((file) => !keep.has(file.id));
}
