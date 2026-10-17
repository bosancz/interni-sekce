import { Component, computed, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { IonButton, IonButtons, IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { logoGithub } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ChangelogLinksPipe } from "src/app/shared/pipes/changelog-links.pipe";
import { MarkdownPipe } from "src/app/shared/pipes/markdown.pipe";
import { ModalLayoutComponent } from "../modal-layout/modal-layout.component";
import { filterChangelog, getChangelogTypes } from "./changelog-filter";

@Component({
	selector: "bo-changelog-modal",
	templateUrl: "./changelog-modal.component.html",
	styleUrl: "./changelog-modal.component.scss",
	imports: [ModalLayoutComponent, IonButtons, IonButton, IonIcon, MarkdownPipe, ChangelogLinksPipe],
})
export class ChangelogModalComponent extends InputModalComponent<void> {
	private readonly api = inject(ApiService);

	readonly repositoryUrl = "https://github.com/bosancz/interni-sekce";

	content = toSignal(this.api.changelog);

	types = computed(() => getChangelogTypes(this.content() ?? ""));

	selectedTypes = signal<ReadonlySet<string>>(new Set());

	filteredContent = computed(() => filterChangelog(this.content() ?? "", this.selectedTypes()));

	constructor() {
		super(inject(ModalController));
		addIcons({ logoGithub });
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
	}

	showAll() {
		this.selectedTypes.set(new Set());
	}
}
