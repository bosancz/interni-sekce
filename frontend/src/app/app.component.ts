import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
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
  environment?: string;

  version = "X.X.X"; // packageJson.version;

  splitPaneWhen: boolean | string = false;

  user = this.userService.user;

  constructor(
    private userService: UserService,
    private loginService: LoginService,
    private route: ActivatedRoute,
    private router: Router,
    private menuController: MenuController,
    private api: ApiService,
    public platform: Platform,
  ) {}

  ngOnInit() {
    this.userService.user.subscribe((user) => this.api.reloadEndpoints());

    this.loginService.onLogin.subscribe(() => {
      this.userService.loadUser();
    });
    this.loginService.onLogout.subscribe(() => {
      this.userService.loadUser();
    });

    this.loadEnvironment();
  }

  private async loadEnvironment() {
    const apiInfo = await this.api.api.getApiInfo().then((res) => res.data);
    this.environment = apiInfo.environmentTitle;
    this.version = apiInfo.version;
  }

  closeMenu() {
    this.menuController.close();
  }
}
