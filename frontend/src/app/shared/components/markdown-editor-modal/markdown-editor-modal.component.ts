import { Component, input, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
	IonButton,
	IonButtons,
	IonTextarea,
	ModalController,
} from "@ionic/angular/standalone";
import { AbstractModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "../modal-layout/modal-layout.component";

@Component({
	selector: "bo-markdown-editor-modal",
	templateUrl: "./markdown-editor-modal.component.html",
	styleUrl: "./markdown-editor-modal.component.scss",

	imports: [ModalLayoutComponent, FormsModule, IonButtons, IonButton, IonTextarea],
})
export class MarkdownEditorModalComponent extends AbstractModalComponent<string | null> {
	header = input<string | undefined>();
	placeholder = input<string | undefined>();
	value = input<string | null | undefined>();

	editor = viewChild(IonTextarea);

	content = "";

	constructor(modalController: ModalController) {
		super(modalController);
	}

	ngOnInit() {
		this.content = this.value() ?? "";
	}

	onEditorKeydown(event: KeyboardEvent) {
		if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;

		if (event.key.toLowerCase() === "b") {
			event.preventDefault();
			void this.addBold();
		}

		if (event.key.toLowerCase() === "i") {
			event.preventDefault();
			void this.addItalic();
		}
	}

	onAddBold() {
		void this.addBold();
	}

	onAddItalic() {
		void this.addItalic();
	}

	onAddList() {
		void this.addList();
	}

	async addBold() {
		await this.wrapSelection("**");
	}

	async addItalic() {
		await this.wrapSelection("_");
	}

	async addList() {
		await this.transformSelection((selected) => {
			if (!selected.length) return "- ";

			return selected
				.split("\n")
				.map((line) => (line.length ? (line.startsWith("- ") ? line : `- ${line}`) : "- "))
				.join("\n");
		});
	}

	save() {
		this.submit.emit(this.content.trim() ? this.content : null);
	}

	private wrapSelection(wrapper: string) {
		return this.transformSelection(
			(selected) => `${wrapper}${selected}${wrapper}`,
			wrapper.length,
			wrapper.length,
		);
	}

	private async transformSelection(
		transform: (selected: string) => string,
		cursorOffsetWithoutSelection = 0,
		cursorOffsetWithSelection = 0,
	) {
		const input = await this.editor()?.getInputElement();
		if (!input) return;

		const value = this.content;
		const selectionStart = input.selectionStart ?? value.length;
		const selectionEnd = input.selectionEnd ?? value.length;
		const selectedText = value.slice(selectionStart, selectionEnd);
		const transformed = transform(selectedText);
		const newValue = `${value.slice(0, selectionStart)}${transformed}${value.slice(selectionEnd)}`;
		const newCursorPosition = selectedText.length
			? selectionStart + transformed.length - cursorOffsetWithSelection
			: selectionStart + transformed.length - cursorOffsetWithoutSelection;

		this.content = newValue;

		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		input.setSelectionRange(newCursorPosition, newCursorPosition);
		input.focus();
	}
}
