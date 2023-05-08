import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { MenuController, Platform } from "@ionic/angular";
import { filter, map, mergeMap } from "rxjs/operators";
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

  constructor(
    private userService: UserService,
    private loginService: LoginService,
    private route: ActivatedRoute,
    private router: Router,
    private menuController: MenuController,
    private api: ApiService,
    public platform: Platform,
  ) {
    this.initUserService();

    this.initLoginService();

    this.loadEnvironment();
  }

  ngOnInit() {
    // get data of current child route
    const routeData = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.rootRoute(this.route)),
      filter((route) => route.outlet === "primary"),
      mergeMap((route) => route.data),
    );

    // hide menu on some pages (e.g. login page)
    routeData.subscribe((data) => {
      if (data.hideMenu) this.splitPaneWhen = false;
      else this.splitPaneWhen = "lg";
    });
  }

  private rootRoute(route: ActivatedRoute) {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }

  private initUserService() {
    this.userService.loadUser();
  }

  private initLoginService() {
    this.loginService.onLogin.subscribe(() => {
      this.userService.loadUser();
    });
    this.loginService.onLogout.subscribe(() => {
      this.userService.loadUser();
    });
  }

  private async loadEnvironment() {
    this.environment = await this.api.api.getApiInfo().then((res) => res.data.environmentTitle);
  }

  closeMenu() {
    this.menuController.close();
  }
}
