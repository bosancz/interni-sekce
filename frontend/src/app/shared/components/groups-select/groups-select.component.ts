import { AfterViewInit, Component, ElementRef, forwardRef, Input, OnInit } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { GroupResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";

@Component({
    selector: "bo-group-select",
    templateUrl: "./groups-select.component.html",
    styleUrls: ["./groups-select.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: forwardRef(() => GroupsSelectComponent),
        },
    ],
    host: {
        "[class.disabled]": "disabled",
        "[class.readonly]": "readonly",
    },
    standalone: false
})
export class GroupsSelectComponent implements OnInit, ControlValueAccessor, AfterViewInit {
  groups?: GroupResponseWithLinks[];

  selectedGroups: number[] = [];

  disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() multiple: boolean = false;

  onChange: (value: number | number[]) => void = () => {};
  onTouched: () => void = () => {};

  constructor(
    private elRef: ElementRef<HTMLElement>,
    private api: ApiService,
  ) {
    this.loadGroups();
  }

  ngOnInit() {}

  async loadGroups() {
    this.groups = await this.api.members.listGroups({ active: true }).then((res) => res.data);
  }

  ngAfterViewInit() {
    this.emitIonStyle();
  }

  emitChange() {
    if (this.multiple) this.onChange(this.selectedGroups);
    else this.onChange(this.selectedGroups[0]);
  }

  isSelected(groupId: number) {
    return this.selectedGroups.indexOf(groupId) !== -1;
  }

  selectAll(checked: boolean): void {
    if (this.disabled || this.readonly || !this.multiple) return;

    if (checked) {
      this.selectedGroups = this.groups?.map((group) => group.id) ?? [];
    } else {
      this.selectedGroups = [];
    }

    this.emitChange();
  }

  isSelectedAll(): boolean {
    return this.groups?.every((group) => this.selectedGroups.includes(group.id)) ?? false;
  }

  toggleGroup(groupId: number) {
    if (this.disabled || this.readonly) return;

    let i = this.selectedGroups.indexOf(groupId);

    if (i === -1) {
      if (!this.multiple) this.selectedGroups = [];
      this.selectedGroups.push(groupId);
    } else {
      if (!this.multiple) this.selectedGroups = [];
      else this.selectedGroups.splice(i, 1);
    }

    this.emitChange();
  }

  private emitIonStyle() {
    this.elRef.nativeElement.dispatchEvent(
      new CustomEvent("ionStyle", {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: {
          interactive: true,
          input: true,
          "has-placeholder": true,
          "has-value": true,
          "has-focus": false,
          "interactive-disabled": this.disabled,
        },
      }),
    );
  }

  // ControlValueAccessor
  writeValue(groups: number | number[] | undefined): void {
    if (this.multiple) {
      this.selectedGroups = Array.isArray(groups) ? groups : this.groups?.map((group) => group.id) ?? [];
    } else {
      this.selectedGroups = groups ? (Array.isArray(groups) ? groups : [groups]) : [];
    }
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.selectedGroups = [];
  }
}
