import {
  AfterContentInit,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChild,
} from "@angular/core";
import { NgModel } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { IonModal } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { UrlParams } from "src/helpers/typings";

export type FilterData = any;

@UntilDestroy()
@Component({
  selector: "bo-filter",
  templateUrl: "./filter.component.html",
  styleUrls: ["./filter.component.scss"],
  // providers: [{ provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => FilterComponent) }],
})
export class FilterComponent implements AfterContentInit {
  @Input() search: boolean = false;
  @Input() paramsSeparator: string = ",";
  @Output() change = new EventEmitter<FilterData>();

  @ViewChild(IonModal) modal?: IonModal;

  @ContentChildren(NgModel, { descendants: true }) controls!: QueryList<NgModel>;

  readonly filterId = String(new Date().getTime());

  searchString?: string;

  // ControlValueAccessor
  disabled = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  public ngAfterContentInit() {
    setTimeout(() => {
      this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => {
        this.setControls(params);
        this.emitValue();
      });
    });
  }

  public onCancel() {
    this.modal!.dismiss();
    this.setControls(this.route.snapshot.queryParams);
  }

  onSubmit() {
    this.modal!.dismiss();
    this.setParams();
  }

  public setParams() {
    const queryParams: UrlParams = { ...this.route.snapshot.queryParams };

    this.controls.forEach((item) => {
      if (Array.isArray(item.value))
        queryParams[item.name] = item.value.map((i) => String(i)).join(this.paramsSeparator);
      else if (item.value) queryParams[item.name] = String(item.value);
      else delete queryParams[item.name];
    });

    if (this.search) {
      if (this.searchString) queryParams.search = this.searchString;
      else delete queryParams.search;
    }

    this.router.navigate([], { queryParams, replaceUrl: true });
  }

  emitValue() {
    const value: FilterData = this.controls.reduce((acc, cur) => ({ ...acc, [cur.name]: cur.value || null }), {});
    if (this.search && this.searchString) value["search"] = this.searchString;
    this.change.emit(value);
  }

  setControls(params: UrlParams) {
    for (const item of this.controls) {
      let value: any = params[item.name]?.split(this.paramsSeparator);
      if (Array.isArray(value) && value.length === 1) value = value[0];

      item.control.setValue(value || null);
    }

    if (this.search && params["search"]) this.searchString = params["search"];
  }

  public getFilterCount() {
    return this.controls.reduce((acc, cur) => acc + (cur.value ? 1 : 0), 0);
  }
}
