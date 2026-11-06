import { MemberBadgeChange, MemberBadgeChangeKind } from "src/models/notifications/helpers/member-badge-changes";
import { MemberAchievementTypes } from "../entities/member-achievements.entity";
import { MemberTraining, MemberTrainingTypes } from "../entities/member-training.entity";

export const MemberAchievementTitles: Record<MemberAchievementTypes, string> = {
	[MemberAchievementTypes.novackovskaZkouska]: "Nováčkovská zkouška",
	[MemberAchievementTypes.hvezda1]: "1. hvězda",
	[MemberAchievementTypes.hvezda2]: "2. hvězda",
	[MemberAchievementTypes.hvezda3]: "3. hvězda",
	[MemberAchievementTypes.hvezda4]: "4. hvězda",
	[MemberAchievementTypes.cernySan]: "Černý šán",
	[MemberAchievementTypes.clunar]: "Člunař",
	[MemberAchievementTypes.kormidelnik]: "Kormidelník",
	[MemberAchievementTypes.lodivod]: "Lodivod",
};

export const MemberTrainingTitles: Record<MemberTrainingTypes, string> = {
	[MemberTrainingTypes.zdravotnik]: "Zdravotník",
	[MemberTrainingTypes.instruktorVodniTuristiky]: "Instruktor vodní turistiky",
	[MemberTrainingTypes.lanac]: "Lanáč",
	[MemberTrainingTypes.vudceMalehoPlavidla]: "Vůdce malého plavidla",
	[MemberTrainingTypes.ridicskyPrukazB]: "Řidičský průkaz B",
	[MemberTrainingTypes.ridicskyPrukazVlek]: "Řidičský průkaz na vlek (B96 a vyšší)",
	[MemberTrainingTypes.custom]: "Jiné školení",
};

export function getMemberTrainingTitle(training: Pick<MemberTraining, "type" | "name">) {
	return training.type === MemberTrainingTypes.custom && training.name
		? training.name
		: MemberTrainingTitles[training.type];
}

export function getMemberTrainingChange(
	training: Pick<MemberTraining, "id" | "type" | "name">,
	kind: MemberBadgeChangeKind,
): MemberBadgeChange {
	return { key: `training:${training.id}`, category: "training", title: getMemberTrainingTitle(training), kind };
}
