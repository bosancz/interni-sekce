import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { ViewDidEnter, ViewWillLeave } from "@ionic/angular";
import { TitleService } from "src/app/services/title.service";
import { Action } from "../action-buttons/action-buttons.component";

@Component({
  selector: "bo-page-header",
  templateUrl: "./page-header.component.html",
  styleUrls: ["./page-header.component.scss"],
})
export class PageHeaderComponent implements OnChanges, ViewDidEnter, ViewWillLeave {
  @Input() actions?: Action[];

  @Input() title?: string;

  @Input() backUrl?: string;

  @Input() actionsHeader?: string;

  viewActive: boolean = false;

  constructor(private titleService: TitleService) {}

  ionViewDidEnter(): void {
    this.viewActive = true;
    this.setWindowTitle(this.title ?? null);
  }

  ionViewWillLeave(): void {
    this.viewActive = false;
    this.setWindowTitle(null);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["title"] && this.viewActive) {
      this.setWindowTitle(this.title ?? null);
    }
  }

  setWindowTitle(title: string | null): void {
    this.titleService.setPageTitle(this.title ?? null);
  }
}
