import { Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { IonModal } from "@ionic/angular";

@Component({
  selector: "bo-filter",
  templateUrl: "./filter.component.html",
  styleUrls: ["./filter.component.scss"],
  // providers: [{ provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => FilterComponent) }],
})
export class FilterComponent {
  @Input() disabled: boolean = false;
  @Output() cancel = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  @ViewChild(IonModal) modal?: IonModal;

  public onCancel() {
    this.modal!.dismiss();
    this.cancel.emit();
  }

  public onSubmit() {
    this.modal!.dismiss();
    this.submit.emit();
  }
}
