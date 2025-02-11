import { Component, ViewChild } from "@angular/core";
import { IonMenu } from "@ionic/angular";

@Component({
    selector: "bo-app-layout",
    templateUrl: "./app-layout.component.html",
    styleUrls: ["./app-layout.component.scss"],
    standalone: false
})
export class AppLayoutComponent {
  @ViewChild(IonMenu) private menu!: IonMenu;

  closeMenu() {
    this.menu.close();
  }
}
