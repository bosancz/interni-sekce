import { Component, Input } from "@angular/core";

@Component({
    selector: "bo-icon-button",
    templateUrl: "./icon-button.component.html",
    styleUrl: "./icon-button.component.scss",
    standalone: false
})
export class IconButtonComponent {
  @Input() label?: string;
  @Input() icon?: string;
  @Input() href?: string;

  constructor() {}

  onClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.href) {
      window.location.href = this.href;
    }
  }
}
