import { Component, signal } from "@angular/core";
import { IonButton, IonButtons, ModalController } from "@ionic/angular/standalone";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { MarkdownEditorComponent } from "../markdown-editor/markdown-editor.component";
import { ModalLayoutComponent } from "../modal-layout/modal-layout.component";

@Component({
	selector: "bo-markdown-editor-modal",
	templateUrl: "./markdown-editor-modal.component.html",
	styleUrl: "./markdown-editor-modal.component.scss",
	imports: [ModalLayoutComponent, IonButtons, IonButton, MarkdownEditorComponent],
})
export class MarkdownEditorModalComponent extends InputModalComponent<string | null> {
	header?: string;
	placeholder?: string;
	value?: string | null;

	content = signal<string>("");

	constructor(modalController: ModalController) {
		super(modalController);
	}

	ngOnInit() {
		this.content.set(this.value ?? "");
	}

	save() {
		this.submit.emit(this.content().trim() ? this.content() : null);
	}
}
