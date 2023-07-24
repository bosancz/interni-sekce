import { AfterViewInit, Component, EventEmitter, Output, ViewChild } from "@angular/core";
import { NgForm } from "@angular/forms";

@Component({
  selector: "bo-filter",
  templateUrl: "./filter.component.html",
  styleUrls: ["./filter.component.scss"],
})
export class FilterComponent implements AfterViewInit {
  showFilter = false;

  @Output() change = new EventEmitter<any>();

  @ViewChild("filterForm", { static: true }) filterForm!: NgForm;

  ngAfterViewInit() {
    this.filterForm.valueChanges!.subscribe((filter) => {
      this.change.emit(filter);
    });
  }
}
