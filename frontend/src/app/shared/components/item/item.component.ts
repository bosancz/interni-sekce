import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: "bo-item",
  templateUrl: "./item.component.html",
  styleUrl: "./item.component.scss",
})
export class ItemComponent {
  @Input() label?: string;
  @Input() editable: boolean = false;
  @Input() loading?: boolean;
  @Input() lines?: string;

  @Output() edit = new EventEmitter<void>();
}
