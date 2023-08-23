import { Component, OnDestroy, OnInit } from "@angular/core";
import { Meta } from "@angular/platform-browser";

import { TitleService } from "src/app/services/title.service";

@Component({
  selector: "not-found",
  templateUrl: "./not-found.component.html",
  styleUrls: ["./not-found.component.scss"],
})
export class NotFoundComponent implements OnInit, OnDestroy {
  url?: string;

  constructor(private titleService: TitleService, private metaService: Meta) {}

  ngOnInit() {
    this.setNoIndex();

    this.url = location.pathname || location.href;
  }

  ngOnDestroy() {
    this.removeNoIndex();
  }

  setNoIndex() {
    this.metaService.addTag({ name: "googlebot", content: "noindex" });
    this.metaService.addTag({ name: "robots", content: "noindex" });
  }

  removeNoIndex() {
    this.metaService.removeTag('name="googlebot"');
    this.metaService.removeTag('name="robots"');
  }
}
