import { Component, input, model, signal, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IonButton, IonSegment, IonSegmentButton, IonTextarea } from "@ionic/angular/standalone";
import { TooltipDirective } from "../../directives/tooltip.directive";
import { MarkdownPipe } from "../../pipes/markdown.pipe";

// TODO: use the new `implements FormValueControl<string>`
@Component({
	selector: "bo-markdown-editor",
	templateUrl: "./markdown-editor.component.html",
	styleUrl: "./markdown-editor.component.scss",
	imports: [FormsModule, IonButton, IonTextarea, IonSegment, IonSegmentButton, MarkdownPipe, TooltipDirective],
})
export class MarkdownEditorComponent {
	placeholder = input<string | undefined>();

	content = model<string>("");

	editor = viewChild(IonTextarea);

	view = signal<"edit" | "preview" | "help">("edit");

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

	onAddHeading(level: 1 | 2 | 3) {
		void this.addHeading(level);
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

	async addHeading(level: 1 | 2 | 3) {
		const prefix = `${"#".repeat(level)} `;

		await this.transformSelection((selected) => {
			if (!selected.length) return prefix;

			return selected
				.split("\n")
				.map((line) => {
					const stripped = line.replace(/^#{1,6}\s+/, "");
					return `${prefix}${stripped}`;
				})
				.join("\n");
		});
	}

	private wrapSelection(wrapper: string) {
		return this.transformSelection(
			(selected) => {
				const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(selected);
				const [, leading, inner, trailing] = match ?? ["", "", selected, ""];
				if (!inner) return `${wrapper}${wrapper}`;
				const cleaned = inner.split(wrapper).join("");
				return `${leading}${wrapper}${cleaned}${wrapper}${trailing}`;
			},
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

		const value = input.value;
		const selectionStart = input.selectionStart ?? value.length;
		const selectionEnd = input.selectionEnd ?? value.length;
		const selectedText = value.slice(selectionStart, selectionEnd);
		const transformed = transform(selectedText);

		input.focus();
		input.setSelectionRange(selectionStart, selectionEnd);

		const supportsInsertText =
			typeof document.queryCommandSupported === "function" && document.queryCommandSupported("insertText");
		const inserted = supportsInsertText && document.execCommand("insertText", false, transformed);

		if (!inserted) {
			const newValue = `${value.slice(0, selectionStart)}${transformed}${value.slice(selectionEnd)}`;
			this.content.set(newValue);
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		}

		const newCursorPosition = selectedText.length
			? selectionStart + transformed.length - cursorOffsetWithSelection
			: selectionStart + transformed.length - cursorOffsetWithoutSelection;

		input.setSelectionRange(newCursorPosition, newCursorPosition);
		input.focus();
	}
}
