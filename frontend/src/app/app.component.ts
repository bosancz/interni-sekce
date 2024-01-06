import { Component, OnInit } from "@angular/core";
import { MenuController, Platform } from "@ionic/angular";
import { LoginService } from "src/app/services/login.service";
import { UserService } from "src/app/services/user.service";
import { ApiService } from "./services/api.service";

@Component({
  selector: "bo-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  user = this.userService.user;

  constructor(
    private userService: UserService,
    private loginService: LoginService,
    private menuController: MenuController,
    private api: ApiService,
    public platform: Platform,
  ) {}

  ngOnInit() {
    this.userService.user.subscribe((user) => {
      if (user !== undefined) {
        this.api.reloadApi();
      }
    });

    this.loginService.onLogin.subscribe(() => {
      this.userService.loadUser();
    });
    this.loginService.onLogout.subscribe(() => {
      this.userService.clearUser();
    });
  }

  closeSidebar() {
    this.menuController.close();
  }
}
