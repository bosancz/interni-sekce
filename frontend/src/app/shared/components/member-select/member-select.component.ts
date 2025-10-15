import { Component, Input, forwardRef } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { BackendApiTypes } from "src/sdk/backend.client";

@Component({
	selector: "bo-member-select",
	templateUrl: "./member-select.component.html",
	styleUrls: ["./member-select.component.scss"],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => MemberSelectComponent),
			multi: true,
		},
	],
	standalone: false,
})
export class MemberSelectComponent implements ControlValueAccessor {
	@Input() multiple: boolean = false;

	members?: BackendApiTypes.MemberResponseWithLinks[];
	selectedMembers: number[] = [];

	constructor(private api: BackendApi) {}

	async loadMembers() {
		this.members = await this.api.MembersApi.listMembers().then((res) => res.data);
	}

	onChange: (value: number | number[]) => void = () => {};
	onTouched: () => void = () => {};

	writeValue(obj: number | number[] | undefined): void {
		if (this.multiple && Array.isArray(obj)) this.selectedMembers = obj;
		else if (!this.multiple && !Array.isArray(obj)) this.selectedMembers = obj ? [obj] : [];
	}
	registerOnChange(fn: (value: number | number[] | undefined) => void): void {
		this.onChange = fn;
	}
	registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}
	setDisabledState?(isDisabled: boolean): void {
		throw new Error("Method not implemented.");
	}
}
