import { computed, effect, Injectable, signal, untracked } from "@angular/core";
import { DateTime } from "luxon";
import { OfflineKeys } from "src/app/core/offline/offline-responses";
import {
	clearOfflineEntries,
	deleteOfflineEntriesExcept,
	getOfflineEntry,
	OfflineMeta,
	putOfflineEntry,
	readOfflineMeta,
	writeOfflineMeta,
} from "src/app/core/offline/offline-store";
import { Logger } from "src/logger";
import { SDK } from "src/sdk";
import { ApiService } from "./api.service";
import { ToastService } from "./toast.service";
import { UserService } from "./user.service";

const REFRESH_AFTER_HOURS = 12;
const PAGE_SIZE = 200;
const CONCURRENCY = 4;

export interface OfflineProgress {
	done: number;
	total: number;
}

@Injectable({
	providedIn: "root",
})
export class OfflineDataService {
	private readonly logger = new Logger(OfflineDataService.name);

	readonly meta = signal<OfflineMeta | null>(readOfflineMeta());

	readonly progress = signal<OfflineProgress | null>(null);

	readonly enabled = computed(() => !!this.meta());

	readonly available = computed(() => !!this.meta()?.downloadedAt);

	readonly offline = this.api.offline;

	private running: Promise<boolean> | null = null;

	constructor(
		private api: ApiService,
		private userService: UserService,
		private toastService: ToastService,
	) {
		effect(() => {
			const user = this.userService.currentUser();
			const links = this.api.links();
			const offline = this.api.offline();
			untracked(() => this.sync(user, links, offline));
		});

		effect(() => {
			if (!this.api.servedOffline()) return;
			untracked(() => this.notifyServedOffline());
		});
	}

	private async disable() {
		this.setMeta(null);
		await clearOfflineEntries().catch((err) => this.logger.error("Clearing offline data failed", err));
	}

	download(silent = false): Promise<boolean> {
		if (!this.running) {
			this.running = this.runDownload(silent).finally(() => {
				this.running = null;
				this.progress.set(null);
			});
		}
		return this.running;
	}

	private sync(
		user: SDK.AccountResponseWithLinks | null | undefined,
		links: SDK.RootResponseLinks | undefined,
		offline: boolean,
	) {
		if (user === undefined) return;

		let meta = this.meta();

		if (meta && (!user || user.id !== meta.userId)) {
			this.disable();
			meta = null;
		}

		if (!user || !links || offline) return;

		if (!links.listMembers?.allowed) {
			if (meta) this.disable();
			return;
		}

		if (!meta) {
			meta = { userId: user.id, downloadedAt: null };
			this.setMeta(meta);
		}

		if (this.isStale(meta)) this.download(true);
	}

	private isStale(meta: OfflineMeta) {
		if (!meta.downloadedAt) return true;
		return DateTime.fromISO(meta.downloadedAt).plus({ hours: REFRESH_AFTER_HOURS }) < DateTime.now();
	}

	private setMeta(meta: OfflineMeta | null) {
		writeOfflineMeta(meta);
		this.meta.set(meta);
	}

	private notifyServedOffline() {
		const downloadedAt = this.meta()?.downloadedAt;
		const date = downloadedAt ? DateTime.fromISO(downloadedAt).toFormat("d. M. H:mm") : null;
		this.toastService.toast(
			date
				? `Jsi bez internetu – zobrazuji data stažená ${date}.`
				: "Jsi bez internetu – zobrazuji stažená data.",
		);
	}

	private async runDownload(silent: boolean): Promise<boolean> {
		const user = this.userService.currentUser();
		if (!user || this.meta()?.userId !== user.id) return false;

		const generation = Date.now();
		const options = { offlineFallback: false };
		const put = (key: string, data: unknown) => putOfflineEntry(key, data, generation);

		try {
			const [root, account, groups] = await Promise.all([
				this.api.RootApi.getApiInfo(options).then((res) => res.data),
				this.api.AccountApi.getMe(options).then((res) => res.data),
				this.api.MembersApi.listGroups({ includeMemberCounts: true }, options).then((res) => res.data),
			]);
			await put(OfflineKeys.root, root);
			await put(OfflineKeys.account, account);
			await put(OfflineKeys.groups, groups);

			const members: SDK.MemberResponseWithLinks[] = [];
			for (let offset = 0; ; offset += PAGE_SIZE) {
				const page = await this.api.MembersApi.listMembers(
					{ active: true, contacts: true, limit: PAGE_SIZE, offset },
					options,
				).then((res) => res.data);
				members.push(...page);
				if (page.length < PAGE_SIZE) break;
			}
			await put(OfflineKeys.members, members);

			this.progress.set({ done: 0, total: groups.length + members.length });

			let insuranceCards = 0;

			const tasks = [
				...groups.map((group) => async () => {
					const detail = await this.api.MembersApi.getGroup(group.id, options).then((res) => res.data);
					await put(OfflineKeys.group(group.id), detail);
				}),
				...members.map((member) => async () => {
					const [detail, contacts] = await Promise.all([
						this.api.MembersApi.getMember(member.id, options).then((res) => res.data),
						this.api.MembersApi.listContacts(member.id, options).then((res) => res.data),
					]);
					await put(OfflineKeys.member(member.id), detail);
					await put(OfflineKeys.contacts(member.id), contacts);

					if (detail.insuranceCardFile && detail._links.getInsuranceCard?.allowed) {
						await this.downloadInsuranceCard(member.id, put);
						insuranceCards++;
					}
				}),
			];

			await this.runPool(tasks, () => this.progress.update((p) => (p ? { ...p, done: p.done + 1 } : p)));

			if (this.meta()?.userId !== user.id) {
				await clearOfflineEntries();
				return false;
			}

			await deleteOfflineEntriesExcept(generation);

			this.setMeta({
				userId: user.id,
				downloadedAt: new Date().toISOString(),
				members: members.length,
				insuranceCards,
			});

			if (!silent) this.toastService.toast("Databáze je stažená pro offline režim.", { color: "success" });

			return true;
		} catch (err) {
			this.logger.error("Offline download failed", err);
			if (!silent) this.toastService.toast("Stažení databáze se nezdařilo.", { color: "danger" });
			return false;
		}
	}

	private async downloadInsuranceCard(memberId: number, put: (key: string, data: unknown) => Promise<void>) {
		const [cached, cachedEtag] = await Promise.all([
			getOfflineEntry<Blob>(OfflineKeys.insuranceCard(memberId)),
			getOfflineEntry<string>(OfflineKeys.insuranceCardEtag(memberId)),
		]);
		const conditional = cached !== undefined && !!cachedEtag;

		const res = await this.api.MembersApi.getInsuranceCard(memberId, {
			offlineFallback: false,
			responseType: "blob",
			headers: conditional ? { "If-None-Match": cachedEtag } : undefined,
			validateStatus: (status) => (status >= 200 && status < 300) || (conditional && status === 304),
		});

		const etag = res.headers["etag"] as string | undefined;
		const card = res.status === 304 ? cached : (res.data as unknown as Blob);

		await put(OfflineKeys.insuranceCard(memberId), card);
		if (etag) await put(OfflineKeys.insuranceCardEtag(memberId), etag);
	}

	private async runPool(tasks: (() => Promise<void>)[], onDone: () => void) {
		let next = 0;
		const worker = async () => {
			while (next < tasks.length) {
				const task = tasks[next++];
				await task();
				onDone();
			}
		};
		await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, worker));
	}
}
