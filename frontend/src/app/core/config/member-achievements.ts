import { SDK } from "src/sdk";

export type MemberAchievementGroup = "san" | "rank";

export interface MemberAchievementMetadata {
	title: string;
	description: string;
	icon: string;
	group?: MemberAchievementGroup;
	rank?: number;
	star?: number;
}

const STAR_ICON = "assets/img/achievements/hvezda.svg";

export const MemberAchievementTypes: { [type in SDK.MemberAchievementTypesEnum]: MemberAchievementMetadata } = {
	novackovskaZkouska: {
		title: "Nováčkovská zkouška",
		description: "Modrý šán",
		icon: "assets/img/achievements/novackovska-zkouska.svg",
		group: "san",
	},
	hvezda1: { title: "1. hvězda", description: "Levý horní roh šánu", icon: STAR_ICON, group: "san", star: 1 },
	hvezda2: { title: "2. hvězda", description: "Pravý horní roh šánu", icon: STAR_ICON, group: "san", star: 2 },
	hvezda3: { title: "3. hvězda", description: "Levý dolní roh šánu", icon: STAR_ICON, group: "san", star: 3 },
	hvezda4: { title: "4. hvězda", description: "Pravý dolní roh šánu", icon: STAR_ICON, group: "san", star: 4 },
	cernySan: {
		title: "Černý šán",
		description: "Čestná nášivka za mimořádný význam pro skupinu, přišívá se místo nováčkovské zkoušky",
		icon: "assets/img/achievements/cerny-san.svg",
		group: "san",
	},
	clunar: {
		title: "Člunař",
		description: "Hodnost – kotva",
		icon: "assets/img/achievements/clunar.svg",
		group: "rank",
		rank: 1,
	},
	kormidelnik: {
		title: "Kormidelník",
		description: "Hodnost – kormidlo",
		icon: "assets/img/achievements/kormidelnik.svg",
		group: "rank",
		rank: 2,
	},
	lodivod: {
		title: "Lodivod",
		description: "Hodnost – kotva a kormidlo",
		icon: "assets/img/achievements/lodivod.svg",
		group: "rank",
		rank: 3,
	},
};

export const MEMBER_ACHIEVEMENT_TYPES = Object.keys(MemberAchievementTypes) as SDK.MemberAchievementTypesEnum[];

export const MEMBER_ACHIEVEMENT_STARS = MEMBER_ACHIEVEMENT_TYPES.filter((type) => MemberAchievementTypes[type].star);

export interface MemberAchievementChoice {
	key: SDK.MemberAchievementTypesEnum | "hvezda";
	title: string;
	icon: string;
	held: boolean;
	note?: string;
	type: SDK.MemberAchievementTypesEnum | null;
}

export function getMemberAchievementChoices(held: Set<SDK.MemberAchievementTypesEnum>): MemberAchievementChoice[] {
	const nextStar = MEMBER_ACHIEVEMENT_STARS.find((type) => !held.has(type)) ?? null;

	const canHaveStars = held.has("novackovskaZkouska");

	return MEMBER_ACHIEVEMENT_TYPES.filter(
		(type) => !MemberAchievementTypes[type].star || (type === "hvezda1" && canHaveStars),
	).map((type) =>
		MemberAchievementTypes[type].star
			? {
					key: "hvezda",
					title: "Hvězda",
					icon: STAR_ICON,
					held: !nextStar,
					note: nextStar ? `${MemberAchievementTypes[nextStar].star}. ze 4` : "Má všechny 4",
					type: nextStar,
				}
			: {
					key: type,
					title: MemberAchievementTypes[type].title,
					icon: MemberAchievementTypes[type].icon,
					held: held.has(type),
					note: held.has(type) ? "Už má" : undefined,
					type,
				},
	);
}

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
	if (type === "cernySan") return 0;
	if (type === "novackovskaZkouska") return 1;
	return 1 + (MemberAchievementTypes[type].star ?? 0);
}
