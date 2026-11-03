import { DateTime } from "luxon";
import { SDK } from "src/sdk";

export interface MemberTrainingMetadata {
	title: string;
	icon: string;
}

export const MemberTrainingTypes: { [type in SDK.MemberTrainingTypesEnum]: MemberTrainingMetadata } = {
	zdravotnik: { title: "Zdravotník", icon: "assets/img/trainings/zdravotnik.svg" },
	instruktorVodniTuristiky: {
		title: "Instruktor vodní turistiky",
		icon: "assets/img/trainings/instruktor-vodni-turistiky.svg",
	},
	lanac: { title: "Lanáč", icon: "assets/img/trainings/lanac.svg" },
	custom: { title: "Jiné školení", icon: "assets/img/trainings/vlastni.svg" },
};

export const MEMBER_TRAINING_TYPES = Object.keys(MemberTrainingTypes) as SDK.MemberTrainingTypesEnum[];

export function getMemberTrainingTitle(training: Pick<SDK.MemberTrainingResponse, "type" | "name">) {
	return training.type === "custom" && training.name ? training.name : MemberTrainingTypes[training.type].title;
}

export function isMemberTrainingExpired(
	training: Pick<SDK.MemberTrainingResponse, "validUntil">,
	today = DateTime.now().toISODate(),
) {
	return !!training.validUntil && training.validUntil < today;
}

export interface MemberTrainingBadge {
	training: SDK.MemberTrainingResponseWithLinks;
	expired: boolean;
}

export function getMemberTrainingBadges(
	trainings: SDK.MemberTrainingResponseWithLinks[],
	today = DateTime.now().toISODate(),
): { badges: MemberTrainingBadge[]; hidden: MemberTrainingBadge[] } {
	const groups = new Map<string, SDK.MemberTrainingResponseWithLinks[]>();
	const sorted = [...trainings].sort(
		(a, b) =>
			MEMBER_TRAINING_TYPES.indexOf(a.type) - MEMBER_TRAINING_TYPES.indexOf(b.type) ||
			(b.validUntil ?? "9999").localeCompare(a.validUntil ?? "9999") ||
			(b.issuedOn ?? "").localeCompare(a.issuedOn ?? "") ||
			b.id - a.id,
	);

	for (const training of sorted) {
		const key = training.type === "custom" ? `custom:${(training.name ?? "").trim().toLowerCase()}` : training.type;
		groups.set(key, [...(groups.get(key) ?? []), training]);
	}

	const badges: MemberTrainingBadge[] = [];
	const hidden: MemberTrainingBadge[] = [];

	for (const group of groups.values()) {
		const active = group.filter((training) => !isMemberTrainingExpired(training, today));
		const expired = group.filter((training) => isMemberTrainingExpired(training, today));
		const shownExpired = active.length ? [] : expired.slice(0, 1);

		badges.push(...active.map((training) => ({ training, expired: false })));
		badges.push(...shownExpired.map((training) => ({ training, expired: true })));
		hidden.push(
			...expired.filter((t) => !shownExpired.includes(t)).map((training) => ({ training, expired: true })),
		);
	}

	return { badges, hidden };
}
