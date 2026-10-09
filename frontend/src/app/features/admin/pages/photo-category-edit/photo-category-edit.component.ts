import { DecimalPipe } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { IonButton, IonIcon, IonInput, IonRange, IonSpinner } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { addOutline, closeOutline, eyeOutline, pricetagOutline, trashOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { PhotoHitsGridComponent } from "src/app/shared/components/photo-hits-grid/photo-hits-grid.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { SDK } from "src/sdk";

const DEFAULT_THRESHOLD = 0.25;
const PREVIEW_LIMIT = 200;
const PREVIEW_DEBOUNCE_MS = 600;

@UntilDestroy()
@Component({
	selector: "bo-photo-category-edit",
	templateUrl: "./photo-category-edit.component.html",
	styleUrl: "./photo-category-edit.component.scss",
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		PhotoHitsGridComponent,
		TooltipDirective,
		DecimalPipe,
		IonButton,
		IonIcon,
		IonInput,
		IonRange,
		IonSpinner,
	],
})
export class PhotoCategoryEditComponent {
	readonly minThreshold = 0.1;
	readonly maxThreshold = 0.4;

	category = signal<SDK.PhotoCategoryResponseWithLinks | null>(null);
	loaded = signal(false);

	name = signal("");
	prompts = signal<string[]>([""]);
	threshold = signal(DEFAULT_THRESHOLD);

	preview = signal<SDK.PhotoContentSearchHitResponse[]>([]);
	previewLoading = signal(false);
	saving = signal(false);

	isNew = computed(() => !this.category());
	title = computed(() => (this.isNew() ? "Nová kategorie" : this.category()!.name));
	cleanPrompts = computed(() =>
		this.prompts()
			.map((prompt) => prompt.trim())
			.filter(Boolean),
	);
	aboveThreshold = computed(() => this.preview().filter((hit) => hit.score >= this.threshold()).length);
	canSave = computed(
		() =>
			!!this.name().trim() &&
			this.cleanPrompts().length > 0 &&
			(this.isNew()
				? (this.api.links()?.createPhotoCategory.allowed ?? false)
				: this.category()!._links.updatePhotoCategory.allowed),
	);
	canDelete = computed(() => this.category()?._links.deletePhotoCategory.allowed ?? false);

	private previewTimer?: ReturnType<typeof setTimeout>;
	private previewId = 0;

	constructor(
		private api: ApiService,
		private route: ActivatedRoute,
		private router: Router,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ addOutline, closeOutline, eyeOutline, pricetagOutline, trashOutline });

		this.route.params.pipe(untilDestroyed(this)).subscribe((params) => this.load(params["category"]));
	}

	private async load(param: string) {
		this.loaded.set(false);
		this.preview.set([]);

		if (param === "nova") {
			const prompt = this.route.snapshot.queryParamMap.get("prompt") ?? "";
			this.category.set(null);
			this.name.set(prompt ? prompt.charAt(0).toLocaleUpperCase("cs") + prompt.slice(1) : "");
			this.prompts.set([prompt]);
			this.threshold.set(DEFAULT_THRESHOLD);
		} else {
			try {
				const category = await this.api.WorkerApi.getPhotoCategory(parseInt(param)).then((res) => res.data);
				this.category.set(category);
				this.name.set(category.name);
				this.prompts.set(category.prompts.length ? [...category.prompts] : [""]);
				this.threshold.set(category.threshold);
			} catch {
				this.toastService.toast("Kategorii se nepodařilo načíst.", { color: "danger" });
				return;
			}
		}

		this.loaded.set(true);
		this.loadPreview();
	}

	setPrompt(index: number, value: string | null | undefined) {
		this.prompts.update((prompts) => prompts.map((prompt, i) => (i === index ? (value ?? "") : prompt)));
		this.schedulePreview();
	}

	addPrompt() {
		this.prompts.update((prompts) => [...prompts, ""]);
	}

	removePrompt(index: number) {
		this.prompts.update((prompts) => (prompts.length > 1 ? prompts.filter((_, i) => i !== index) : [""]));
		this.schedulePreview();
	}

	setThreshold(value: unknown) {
		if (typeof value === "number") this.threshold.set(Math.round(value * 1000) / 1000);
	}

	private schedulePreview() {
		clearTimeout(this.previewTimer);
		this.previewTimer = setTimeout(() => this.loadPreview(), PREVIEW_DEBOUNCE_MS);
	}

	async loadPreview() {
		clearTimeout(this.previewTimer);
		const prompts = this.cleanPrompts();
		const previewId = ++this.previewId;

		if (!prompts.length) {
			this.preview.set([]);
			return;
		}

		this.previewLoading.set(true);
		try {
			const preview = await this.api.WorkerApi.previewPhotoCategory({ prompts, limit: PREVIEW_LIMIT }).then(
				(res) => res.data,
			);
			if (previewId === this.previewId) this.preview.set(preview);
		} catch {
			if (previewId === this.previewId)
				this.toastService.toast("Náhled se nepovedl — běží worker s úlohou embed-text?", { color: "danger" });
		} finally {
			if (previewId === this.previewId) this.previewLoading.set(false);
		}
	}

	async save() {
		if (!this.canSave() || this.saving()) return;

		const body = { name: this.name().trim(), prompts: this.cleanPrompts(), threshold: this.threshold() };
		const category = this.category();

		this.saving.set(true);
		try {
			if (category) await this.api.WorkerApi.updatePhotoCategory(category.id, body);
			else await this.api.WorkerApi.createPhotoCategory(body);
			this.toastService.toast("Kategorie uložena.");
			await this.router.navigate(["/admin/fotky/kategorie"]);
		} catch (err: any) {
			const message =
				err?.response?.status === 409
					? "Kategorie s tímto názvem už existuje."
					: "Kategorii se nepodařilo uložit.";
			this.toastService.toast(message, { color: "danger" });
		} finally {
			this.saving.set(false);
		}
	}

	async delete() {
		const category = this.category();
		if (!category || !this.canDelete()) return;

		const confirmed = await this.modalService.deleteConfirmationModal(
			`Kategorie ${category.name} zmizí ze všech fotek. Fotky samotné zůstanou.`,
		);
		if (!confirmed) return;

		try {
			await this.api.WorkerApi.deletePhotoCategory(category.id);
			await this.router.navigate(["/admin/fotky/kategorie"]);
		} catch {
			this.toastService.toast("Kategorii se nepodařilo smazat.", { color: "danger" });
		}
	}
}
