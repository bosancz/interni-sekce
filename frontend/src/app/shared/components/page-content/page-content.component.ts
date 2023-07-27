import { Component, Input, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { IonContent } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

@UntilDestroy()
@Component({
  selector: "bo-page-content",
  templateUrl: "./page-content.component.html",
  styleUrls: ["./page-content.component.scss"],
})
export class PageContentComponent {
  @Input() padding?: boolean;

  @ViewChild(IonContent) contentEl!: IonContent;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.fragment.pipe(untilDestroyed(this)).subscribe((fragment) => {
      if (!fragment) return;

      this.scrollToElement(fragment);
    });
  }

  private scrollToElement(elementId: string, retries = 10): void {
    if (!retries) return;

    const element = document.getElementsByName(elementId)[0] ?? document.getElementById(elementId);

    if (element) setTimeout(() => element.scrollIntoView({ behavior: "smooth", block: "center" }), 500);
    else setTimeout(() => this.scrollToElement(elementId, retries - 1), 500);
  }
}
