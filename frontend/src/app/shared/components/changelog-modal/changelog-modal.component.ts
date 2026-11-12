import { Component, DestroyRef, ElementRef, effect, inject, signal, viewChild } from "@angular/core";
import { IonButton, IonButtons, IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { logoGithub } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ChangelogLinksPipe } from "src/app/shared/pipes/changelog-links.pipe";
import { MarkdownPipe } from "src/app/shared/pipes/markdown.pipe";
import { ModalLayoutComponent } from "../modal-layout/modal-layout.component";
import { ChangelogType, getChangelogTypes } from "./changelog-types";

@Component({
	selector: "bo-changelog-modal",
	templateUrl: "./changelog-modal.component.html",
	styleUrl: "./changelog-modal.component.scss",
	imports: [ModalLayoutComponent, IonButtons, IonButton, IonIcon, MarkdownPipe, ChangelogLinksPipe],
})
export class ChangelogModalComponent extends InputModalComponent<void> {
	private readonly api = inject(ApiService);

	readonly repositoryUrl = "https://github.com/bosancz/interni-sekce";

	types = signal<ChangelogType[] | undefined>(undefined);

	pages = signal<string[]>([]);

	nextOffset = signal<number | null>(0);

	loading = signal(false);

	error = signal(false);

	selectedTypes = signal<ReadonlySet<string>>(new Set());

	private readonly scroller = viewChild<ElementRef<HTMLElement>>("scroller");

	private readonly sentinel = viewChild<ElementRef<HTMLElement>>("sentinel");

	private observer?: IntersectionObserver;

	private request = 0;

	constructor() {
		super(inject(ModalController));
		addIcons({ logoGithub });

		this.load();

		effect(() => {
			const scroller = this.scroller()?.nativeElement;
			const sentinel = this.sentinel()?.nativeElement;
			this.observer?.disconnect();
			if (!scroller || !sentinel) return;
			this.observer = new IntersectionObserver(
				(entries) => {
					if (entries.some((entry) => entry.isIntersecting)) this.load();
				},
				{ root: scroller, rootMargin: "0px 0px 600px 0px" },
			);
			this.observer.observe(sentinel);
		});

		inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
	}

	isShown(type: string) {
		return !this.selectedTypes().size || this.selectedTypes().has(type);
	}

	toggleType(type: string) {
		this.selectedTypes.update((selected) => {
			const next = new Set(selected);
			if (next.has(type)) next.delete(type);
			else next.add(type);
			return next;
		});
		this.reload();
	}

	showAll() {
		this.selectedTypes.set(new Set());
		this.reload();
	}

	private reload() {
		this.request++;
		this.pages.set([]);
		this.nextOffset.set(0);
		this.loading.set(false);
		this.scroller()?.nativeElement.scrollTo({ top: 0 });
		this.load();
	}

	async load() {
		const offset = this.nextOffset();
		if (offset === null || this.loading()) return;

		const request = this.request;
		this.loading.set(true);
		this.error.set(false);

		try {
			const page = await this.api.RootApi.getChangelog({ offset, types: [...this.selectedTypes()] }).then(
				(res) => res.data,
			);
			if (request !== this.request) return;

			this.types.set(getChangelogTypes(page.types));
			if (page.content) this.pages.update((pages) => [...pages, page.content]);
			this.nextOffset.set(page.nextOffset);
		} catch {
			if (request === this.request) this.error.set(true);
		} finally {
			if (request === this.request) this.loading.set(false);
		}

		if (request === this.request) this.recheckSentinel();
	}

	private recheckSentinel() {
		const sentinel = this.sentinel()?.nativeElement;
		if (!this.observer || !sentinel) return;
		this.observer.unobserve(sentinel);
		this.observer.observe(sentinel);
	}
}
