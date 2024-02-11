import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { NgModel } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { IonModal, IonSearchbar } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ModalService } from "src/app/services/modal.service";
import { UrlParams } from "src/helpers/typings";
import { FilterModalComponent } from "../filter-modal/filter-modal.component";

export type FilterData = any;

@UntilDestroy()
@Component({
  selector: "bo-filter",
  templateUrl: "./filter.component.html",
  styleUrls: ["./filter.component.scss"],
  // providers: [{ provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => FilterComponent) }],
})
export class FilterComponent implements AfterContentInit, AfterViewInit {
  @Input() search: boolean = false;
  @Input() paramsSeparator: string = ",";
  @Output() change = new EventEmitter<FilterData>();

  @ViewChild(IonModal) modal?: IonModal;
  @ViewChild(IonSearchbar) searchbar?: IonSearchbar;

  @ContentChildren(NgModel, { descendants: true }) controls!: QueryList<NgModel>;

  readonly filterId = String(new Date().getTime());

  searchString?: string;

  filterCount: number = 0;

  // ControlValueAccessor
  disabled = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
  ) {}

  public ngAfterContentInit() {
    setTimeout(() => {
      this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => {
        this.setControls(params);
        this.emitValue();
      });
    });
  }

  ngAfterViewInit(): void {
    // FIXME: Workaround for focus on searchbar, because it's not working when called directly
    setTimeout(() => this.searchbar?.setFocus(), 500);
  }

  async openFilter(filterContent: TemplateRef<any>) {
    const result = await this.modalService.componentModal(FilterModalComponent, { content: filterContent });

    if (result === true) {
      // filter submitted - set new filters
      this.setParams();
    } else if (result === false) {
      // filter reset - clear all filters
      this.setControls({});
      this.setParams();
    } else {
      // filter dismissed - revert changes
      this.setControls(this.route.snapshot.queryParams);
    }
  }

  onSearchbarUpdate() {
    this.setParams();
  }

  public setParams() {
    const queryParams: UrlParams = { ...this.route.snapshot.queryParams };

    this.controls.forEach((item) => {
      if (Array.isArray(item.value)) {
        queryParams[item.name] = item.value
          .filter((i) => !!i)
          .map((i) => String(i))
          .join(this.paramsSeparator);
      } else {
        queryParams[item.name] = item.value ? String(item.value) : undefined;
      }

      if (!queryParams[item.name]) delete queryParams[item.name];
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

    this.filterCount = this.controls.reduce((acc, cur) => acc + (cur.value ? 1 : 0), 0);

    if (this.search && params["search"]) this.searchString = params["search"];
  }
}
