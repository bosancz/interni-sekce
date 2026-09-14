import { computed, Injectable, Signal, signal } from "@angular/core";
import { ApiService } from "./api.service";
import { LocalStorageService } from "./local-storage.service";
import { UserService } from "./user.service";

export interface UserSettings {
	darkMode?: boolean;
	albumsListView?: "table" | "grid";
	membersListColumns?: { [key: string]: boolean };
}

const PROPAGATED_SETTINGS: (keyof UserSettings)[] = ["darkMode"];

@Injectable({
	providedIn: "root",
})
export class UserSettingsService {
	private readonly cacheKey = "userSettings";

	private readonly stored = signal<UserSettings>(this.readCache());

	private readonly pinned = signal<UserSettings>({});

	private readonly settings = computed<UserSettings>(() => ({ ...this.stored(), ...this.pinned() }));

	private readonly watched = new Set<keyof UserSettings>();

	private queue: Promise<unknown> = Promise.resolve();

	constructor(
		private api: ApiService,
		private localStorage: LocalStorageService,
		private userService: UserService,
	) {
		this.localStorage
			.watchExternal<UserSettings>(this.cacheKey)
			.subscribe((settings) => this.applyExternal(settings ?? {}));

		this.userService.user.subscribe((user) => {
			if (user) this.load();
		});
	}

	watch<K extends keyof UserSettings>(key: K): Signal<UserSettings[K]> {
		this.watched.add(key);
		return computed(() => this.settings()[key]);
	}

	get<K extends keyof UserSettings>(key: K): UserSettings[K] {
		return this.settings()[key];
	}

	set<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
		if (!PROPAGATED_SETTINGS.includes(key)) this.pinned.set({ ...this.pinned(), [key]: value });

		this.store({ ...this.stored(), [key]: value });

		return this.enqueue(() => this.save());
	}

	private applyExternal(settings: UserSettings) {
		const current = this.settings() as { [key: string]: unknown };
		const pinned = { ...this.pinned() } as { [key: string]: unknown };

		for (const key of this.watched) {
			if (PROPAGATED_SETTINGS.includes(key) || key in pinned) continue;
			pinned[key] = current[key];
		}

		this.pinned.set(pinned as UserSettings);
		this.stored.set(settings);
	}

	private load() {
		return this.enqueue(async () => {
			const { settings } = await this.api.AccountApi.getMySettings().then((res) => res.data);

			if (!Object.keys(settings).length && Object.keys(this.stored()).length) return this.save();

			this.store(settings as UserSettings);
		});
	}

	private save() {
		return this.api.AccountApi.setMySettings({ settings: this.stored() });
	}

	private store(settings: UserSettings) {
		this.stored.set(settings);
		this.localStorage.set(this.cacheKey, settings);
	}

	private enqueue<T>(task: () => Promise<T>) {
		this.queue = this.queue.catch(() => {}).then(task);
		return this.queue as Promise<T>;
	}

	private readCache(): UserSettings {
		const cached = this.localStorage.get<UserSettings>(this.cacheKey);
		if (cached) return cached;

		const settings: UserSettings = {};

		const darkMode = this.localStorage.get<boolean>("isDarkMode");
		if (darkMode !== null) settings.darkMode = darkMode;

		const albumsListView = localStorage.getItem("albumsListView");
		if (albumsListView === "table" || albumsListView === "grid") settings.albumsListView = albumsListView;

		return settings;
	}
}
