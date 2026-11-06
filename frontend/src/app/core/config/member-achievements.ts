import { SDK } from "src/sdk";

export type MemberAchievementGroup = "san" | "rank";

export interface MemberAchievementMetadata {
	title: string;
	icon: string;
	group?: MemberAchievementGroup;
	rank?: number;
	star?: number;
}

const STAR_ICON = "assets/img/achievements/hvezda.svg";

export const MemberAchievementTypes: { [type in SDK.MemberAchievementTypesEnum]: MemberAchievementMetadata } = {
	novackovskaZkouska: {
		title: "Nováčkovská zkouška",
		icon: "assets/img/achievements/novackovska-zkouska.svg",
		group: "san",
	},
	hvezda1: { title: "1. hvězda", icon: STAR_ICON, group: "san", star: 1 },
	hvezda2: { title: "2. hvězda", icon: STAR_ICON, group: "san", star: 2 },
	hvezda3: { title: "3. hvězda", icon: STAR_ICON, group: "san", star: 3 },
	hvezda4: { title: "4. hvězda", icon: STAR_ICON, group: "san", star: 4 },
	cernySan: {
		title: "Černý šán",
		icon: "assets/img/achievements/cerny-san.svg",
		group: "san",
	},
	clunar: {
		title: "Člunař",
		icon: "assets/img/achievements/clunar.svg",
		group: "rank",
		rank: 1,
	},
	kormidelnik: {
		title: "Kormidelník",
		icon: "assets/img/achievements/kormidelnik.svg",
		group: "rank",
		rank: 2,
	},
	lodivod: {
		title: "Lodivod",
		icon: "assets/img/achievements/lodivod.svg",
		group: "rank",
		rank: 3,
	},
};

export const MEMBER_ACHIEVEMENT_TYPES = Object.keys(MemberAchievementTypes) as SDK.MemberAchievementTypesEnum[];

export const MEMBER_ACHIEVEMENT_STARS = MEMBER_ACHIEVEMENT_TYPES.filter((type) => MemberAchievementTypes[type].star);

export const MEMBER_ACHIEVEMENT_RANKS = MEMBER_ACHIEVEMENT_TYPES.filter(
	(type) => MemberAchievementTypes[type].group === "rank",
);

export interface MemberAchievementSlot<
	T extends SDK.MemberAchievementResponse = SDK.MemberAchievementResponseWithLinks,
> {
	key: string;
	main: T;
	icon: string;
	stars: number[];
	achievements: T[];
}

export function isMemberAchievementStar(type: SDK.MemberAchievementTypesEnum) {
	return !!MemberAchievementTypes[type].star;
}

export function getMemberAchievementSlots<
	T extends SDK.MemberAchievementResponse = SDK.MemberAchievementResponseWithLinks,
>(achievements: T[]): MemberAchievementSlot<T>[] {
	const order = (a: T) => MEMBER_ACHIEVEMENT_TYPES.indexOf(a.type);
	const sorted = [...achievements].sort((a, b) => order(a) - order(b));
	const slots: MemberAchievementSlot<T>[] = [];

	const san = sorted.filter((a) => MemberAchievementTypes[a.type].group === "san");
	if (san.length) {
		const base = san.find((a) => a.type === "cernySan") ?? san.find((a) => a.type === "novackovskaZkouska") ?? null;
		slots.push({
			key: "san",
			main: base ?? san[0],
			icon: MemberAchievementTypes[base?.type ?? "novackovskaZkouska"].icon,
			stars: san
				.filter((a) => MemberAchievementTypes[a.type].star)
				.map((a) => MemberAchievementTypes[a.type].star!),
			achievements: [...san].sort((a, b) => sanOrder(a) - sanOrder(b)),
		});
	}

	const ranks = sorted
		.filter((a) => MemberAchievementTypes[a.type].group === "rank")
		.sort((a, b) => MemberAchievementTypes[b.type].rank! - MemberAchievementTypes[a.type].rank!);
	if (ranks.length) {
		slots.push({
			key: "rank",
			main: ranks[0],
			icon: MemberAchievementTypes[ranks[0].type].icon,
			stars: [],
			achievements: ranks,
		});
	}

	return slots;
}

function sanOrder(achievement: SDK.MemberAchievementResponse) {
	const type = achievement.type;
	if (type === "novackovskaZkouska") return 0;
	if (type === "cernySan") return 1;
	return 1 + (MemberAchievementTypes[type].star ?? 0);
}
