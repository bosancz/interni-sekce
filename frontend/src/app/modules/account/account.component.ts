import { Component } from "@angular/core";
import { UserResponse } from "src/app/api";
import { ApiService } from "src/app/services/api.service";

@Component({
  selector: "bo-account",
  templateUrl: "./account.component.html",
  styleUrls: ["./account.component.scss"],
})
export class AccountComponent {
  user?: UserResponse;

  modal?: HTMLIonModalElement;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadUser();
  }

  async loadUser() {
    this.user = await this.api.account.getMe().then((res) => res.data);
  }
}
