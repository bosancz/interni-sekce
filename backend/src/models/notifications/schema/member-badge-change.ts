export type MemberBadgeChangeKind = "added" | "updated" | "removed";

export type MemberBadgeCategory = "achievement" | "training";

export interface MemberBadgeChange {
	category: MemberBadgeCategory;
	kind: MemberBadgeChangeKind;
	title: string;
}

export const MemberBadgeChangeTitles: Record<MemberBadgeCategory, Record<MemberBadgeChangeKind, string>> = {
	achievement: { added: "Nové ocenění", updated: "Upravené ocenění", removed: "Odebrané ocenění" },
	training: { added: "Nové školení", updated: "Upravené školení", removed: "Odebrané školení" },
};
