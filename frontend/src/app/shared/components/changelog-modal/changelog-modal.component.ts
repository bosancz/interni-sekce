import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { IonButton, IonButtons, ModalController } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ChangelogLinksPipe } from "src/app/shared/pipes/changelog-links.pipe";
import { MarkdownPipe } from "src/app/shared/pipes/markdown.pipe";
import { ModalLayoutComponent } from "../modal-layout/modal-layout.component";

@Component({
	selector: "bo-changelog-modal",
	templateUrl: "./changelog-modal.component.html",
	styleUrl: "./changelog-modal.component.scss",
	imports: [ModalLayoutComponent, IonButtons, IonButton, MarkdownPipe, ChangelogLinksPipe],
})
export class ChangelogModalComponent extends InputModalComponent<void> {
	private readonly api = inject(ApiService);

	/** `undefined` while loading, the markdown once loaded (may be "" if the file is missing). */
	content = toSignal(this.api.changelog);

	constructor() {
		super(inject(ModalController));
	}
}
