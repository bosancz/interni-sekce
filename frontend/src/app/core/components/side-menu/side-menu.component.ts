import { Component, OnInit } from "@angular/core";
import { SwUpdate } from "@angular/service-worker";
import { NavController, Platform } from "@ionic/angular";

import { LoginService } from "src/app/services/login.service";
import { MenuService } from "src/app/services/menu.service";
import { OnlineService } from "src/app/services/online.service";
import { TitleService } from "src/app/services/title.service";
import { UserService } from "src/app/services/user.service";

@Component({
  selector: "side-menu",
  templateUrl: "./side-menu.component.html",
  styleUrls: ["./side-menu.component.scss"],
})
export class SideMenuComponent implements OnInit {
  submenu?: string;

  dropdownsCollapsed = {
    program: true,
  };

  constructor(
    public titleService: TitleService,
    public menuService: MenuService,
    public userService: UserService,
    private loginService: LoginService,
    private navController: NavController,
    public onlineService: OnlineService,
    public swUpdate: SwUpdate,
    public platform: Platform,
  ) {}

  ngOnInit() {}

  async logout() {
    await this.loginService.logout();
  }

  reload() {
    window.location.reload();
  }
}