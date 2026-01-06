import { Component, input, forwardRef, signal } from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";

@Component({
	selector: "photo-tags-editor",
	templateUrl: "./photo-tags-editor.component.html",
	styleUrls: ["./photo-tags-editor.component.scss"],
	standalone: true,
	imports: [FormsModule],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: forwardRef(() => PhotoTagsEditorComponent),
		},
	],
})
export class PhotoTagsEditorComponent implements ControlValueAccessor {
	tags = input<string[]>([]);
	selectedTags = signal<string[]>([]);

	disabled: boolean = false;

	onChange: any = () => {};
	onTouched: any = () => {};

	writeValue(tags: any): void {
		this.selectedTags.set(tags || []);
	}
	registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}
	setDisabledState(isDisabled: boolean): void {
		this.disabled = isDisabled;
	}

	constructor() {}

	hasTag(tag: string) {
		return this.selectedTags().indexOf(tag) !== -1;
	}

	toggleTag(tag: string) {
		if (this.disabled) return;

		const selected = [...this.selectedTags()];
		let i = selected.indexOf(tag);
		if (i === -1) {
			selected.push(tag);
		} else {
			selected.splice(i, 1);
		}

		this.selectedTags.set(selected);
		this.onChange(selected);
	}

	newTag() {
		if (this.disabled) return;

		let tag = window.prompt("Zadejte název nového tagu:");
		if (!tag) return;

		if (tag.charAt(0) === "#") tag = tag.substring(1);

		const tags = [...this.tags()];
		if (tags.indexOf(tag) === -1) {
			tags.push(tag);
			// Note: tags is an input, so we can't directly modify it
			// This would need to be handled by the parent component
		}

		const selected = [...this.selectedTags()];
		if (selected.indexOf(tag) === -1) {
			selected.push(tag);
			this.selectedTags.set(selected);
			this.onChange(selected);
		}
	}
}
