import { Component, Input } from "@angular/core";
import { Action } from "../action-buttons/action-buttons.component";

@Component({
    selector: "bo-page-header",
    templateUrl: "./page-header.component.html",
    styleUrls: ["./page-header.component.scss"],
    standalone: false
})
export class PageHeaderComponent {
  @Input() actions?: Action[];

  @Input() title?: string;

  @Input() backUrl?: string;

  @Input() actionsHeader?: string;

  viewActive: boolean = false;

  constructor() {}
}
