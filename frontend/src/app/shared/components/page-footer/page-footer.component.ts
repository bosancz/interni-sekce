import { Component, Input } from "@angular/core";

@Component({
  selector: "bo-page-footer",
  templateUrl: "./page-footer.component.html",
  styleUrls: ["./page-footer.component.scss"],
})
export class PageFooterComponent {
  @Input() padding?: boolean;
}
