import { Component, OnInit } from "@angular/core";
import { SwUpdate } from "@angular/service-worker";
import { Platform } from "@ionic/angular";

import { LoginService } from "src/app/services/login.service";
import { TitleService } from "src/app/services/title.service";
import { UserService } from "src/app/services/user.service";

@Component({
  selector: "side-menu",
  templateUrl: "./side-menu.component.html",
  styleUrls: ["./side-menu.component.scss"],
})
export class SideMenuComponent implements OnInit {
  submenu?: string;
  versionUpdates = this.swUpdate.versionUpdates;

  dropdownsCollapsed = {
    program: true,
  };

  constructor(
    public titleService: TitleService,
    public userService: UserService,
    private loginService: LoginService,
    private swUpdate: SwUpdate,
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
