import { Component } from "@angular/core";
import { User } from "src/app/schema/user";
import { ApiService } from "src/app/services/api.service";

@Component({
  selector: "bo-account",
  templateUrl: "./account.component.html",
  styleUrls: ["./account.component.scss"],
})
export class AccountComponent {
  user?: User;

  modal?: HTMLIonModalElement;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadUser();
  }

  async loadUser() {
    this.user = await this.api.get<User>("me:user");
  }
}
