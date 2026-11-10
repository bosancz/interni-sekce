import { computed, inject, Signal } from "@angular/core";
import { UserSettings, UserSettingsService } from "src/app/core/services/user-settings.service";
import { FilterPillOption } from "../filter-pill/filter-pill.component";

type ColumnsSettings = { [key: string]: boolean };

export type PeopleColumnsSettingsKey = {
	[K in keyof UserSettings]-?: NonNullable<UserSettings[K]> extends ColumnsSettings ? K : never;
}[keyof UserSettings];

export const PEOPLE_COLUMN_LABELS: { [key: string]: string } = {
	photo: "Fotka",
	nickname: "Přezdívka",
	firstName: "Jméno",
	lastName: "Příjmení",
	group: "Oddíl",
	role: "Role",
	age: "Věk",
	membership: "Členství",
	birthday: "Narozeniny",
	addressCity: "Město",
	addressStreet: "Ulice",
	firstTelephone: "Telefon na rodiče",
	firstEmail: "Email na rodiče",
	achievements: "Ocenění",
	trainings: "Školení",
	status: "Stav",
};

export const PEOPLE_COLUMNS = Object.keys(PEOPLE_COLUMN_LABELS);

export const PEOPLE_DEFAULT_COLUMNS = ["photo", "nickname", "firstName", "lastName", "group", "role", "age"];

export const PEOPLE_CONTACT_COLUMNS = ["firstTelephone", "firstEmail"];

export const PEOPLE_BADGE_COLUMNS = ["achievements", "trainings"];

export const PEOPLE_SORT_KEYS: { [column: string]: string } = {
	nickname: "nickname",
	firstName: "firstName",
	lastName: "lastName",
	group: "group",
	role: "role",
	age: "age",
	membership: "membership",
	birthday: "birthday",
	addressCity: "city",
	addressStreet: "street",
	status: "status",
};

export interface PeopleColumnsConfig {
	settingsKey: PeopleColumnsSettingsKey;
	columns?: string[];
	defaults?: string[];
	labels?: { [key: string]: string };
}

export class PeopleColumns {
	readonly keys: string[];

	private readonly userSettings = inject(UserSettingsService);

	private readonly saved: Signal<ColumnsSettings | undefined>;

	private readonly labels: { [key: string]: string };

	readonly visible = computed<ColumnsSettings>(() => {
		const saved = this.saved();
		const defaults = new Set(this.config.defaults ?? PEOPLE_DEFAULT_COLUMNS);
		return Object.fromEntries(this.keys.map((key) => [key, saved?.[key] ?? defaults.has(key)]));
	});

	readonly options = computed<FilterPillOption[]>(() =>
		this.keys.map((key) => ({ value: key, label: this.labels[key] ?? key })),
	);

	readonly selected = computed(() => this.keys.filter((key) => this.visible()[key]));

	readonly needsContacts = computed(() => PEOPLE_CONTACT_COLUMNS.some((key) => this.visible()[key]));

	readonly needsBadges = computed(() => PEOPLE_BADGE_COLUMNS.some((key) => this.visible()[key]));

	constructor(private readonly config: PeopleColumnsConfig) {
		this.keys = config.columns ?? PEOPLE_COLUMNS;
		this.labels = { ...PEOPLE_COLUMN_LABELS, ...config.labels };
		this.saved = this.userSettings.watch(config.settingsKey) as Signal<ColumnsSettings | undefined>;
	}

	set(keys: string[]) {
		const selected = new Set(keys);
		this.userSettings.set(
			this.config.settingsKey,
			Object.fromEntries(this.keys.map((key) => [key, selected.has(key)])),
		);
	}
}
