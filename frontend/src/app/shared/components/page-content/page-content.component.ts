import { Component, Input } from "@angular/core";

@Component({
  selector: "bo-page-content",
  templateUrl: "./page-content.component.html",
  styleUrls: ["./page-content.component.scss"],
})
export class PageContentComponent {
  @Input() padding?: boolean;
}
