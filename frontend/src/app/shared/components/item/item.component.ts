import { Component, EventEmitter, Host, Input, Optional, Output } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "bo-item",
  templateUrl: "./item.component.html",
  styleUrl: "./item.component.scss",
  host: { "[class.ion-activatable]": "button", "[class.clickable]": "button || !!routerLink" },
})
export class ItemComponent {
  @Input() label?: string;
  @Input() editable: boolean = false;
  @Input() loading?: boolean;
  @Input() lines?: string;
  @Input() button?: boolean;
  @Input() detail?: boolean;

  @Output() edit = new EventEmitter<void>();

  constructor(@Optional() @Host() public routerLink: RouterLink) {
    console.log(this, routerLink);
  }
}
