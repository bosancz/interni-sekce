import { Component } from "@angular/core";
import { ControlValueAccessor } from "@angular/forms";

@Component({
	selector: "bo-markdown-editor",
	templateUrl: "./markdown-editor.component.html",
	styleUrl: "./markdown-editor.component.scss",
})
export class MarkdownEditorComponent implements ControlValueAccessor {
	private value: string = "";
	private onChange: (value: string) => void = () => {};
	private onTouched: () => void = () => {};

	writeValue(value: string): void {
		this.value = value;
	}

	registerOnChange(fn: (value: string) => void): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	setValue(value: string): void {
		this.value = value;
		this.onChange(value);
		this.onTouched();
	}
}
