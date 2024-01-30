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

@UntilDestroy()
@Component({
  selector: "bo-filter",
  templateUrl: "./filter.component.html",
  styleUrls: ["./filter.component.scss"],
  // providers: [{ provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => FilterComponent) }],
})
export class FilterComponent implements AfterContentInit {
  @Input() search: boolean = false;
  @Output() change = new EventEmitter<UrlParams>();

  @ViewChild(IonModal) modal?: IonModal;

  @ContentChildren(NgModel, { descendants: true }) controls!: QueryList<NgModel>;

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
      if (item.value) queryParams[item.name] = String(item.value);
      else delete queryParams[item.name];
    });

    if (this.search) {
      if (this.searchString) queryParams.search = this.searchString;
      else delete queryParams.search;
    }

    this.router.navigate([], { queryParams, replaceUrl: true });
  }

  emitValue() {
    const value: any = this.controls.reduce((acc, cur) => ({ ...acc, [cur.name]: cur.value || null }), {});
    if (this.search && this.searchString) value["search"] = this.searchString;
    this.change.emit(value);
  }

  setControls(params: UrlParams) {
    this.controls.forEach((item) => {
      item.control.setValue(params[item.name] || null);
    });
    if (this.search && params["search"]) this.searchString = params["search"];
  }

  public getFilterCount() {
    return this.controls.reduce((acc, cur) => acc + (cur.value ? 1 : 0), 0);
  }
}
