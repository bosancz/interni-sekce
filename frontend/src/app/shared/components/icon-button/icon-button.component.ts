import { Component, Input } from "@angular/core";

@Component({
  selector: "bo-icon-button",
  templateUrl: "./icon-button.component.html",
  styleUrl: "./icon-button.component.scss",
})
export class IconButtonComponent {
  @Input() label?: string;
  @Input() icon?: string;
  @Input() href?: string;
  @Input() disabled?: boolean;

  constructor() {}

  onClick(event: Event) {
    if (this.href) {
      event.preventDefault();
      event.stopPropagation();
      window.location.href = this.href;
    }
  }
}
