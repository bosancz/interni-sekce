import { Component, Input, forwardRef } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { MemberResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";

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
})
export class MemberSelectComponent implements ControlValueAccessor {
  @Input() multiple: boolean = false;

  members?: MemberResponseWithLinks[];
  selectedMembers: number[] = [];

  constructor(private api: ApiService) {}

  async loadMembers() {
    this.members = await this.api.members.listMembers().then((res) => res.data);
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
