import { Component, Input, forwardRef } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

@Component({
  selector: "bo-filter",
  templateUrl: "./filter.component.html",
  styleUrls: ["./filter.component.scss"],
  providers: [{ provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => FilterComponent) }],
})
export class FilterComponent implements ControlValueAccessor {
  @Input("search") showSearch = true;

  showFilter = false;

  searchString?: string;

  disabled = false;
  onChange = (filter: any) => {};
  onTouched = () => {};

  searchStringChanged() {
    this.onChange(this.searchString);
  }

  writeValue(value: string): void {
    this.searchString = value;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
