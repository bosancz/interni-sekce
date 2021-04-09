// @ts-nocheck
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { NgForm } from '@angular/forms';

import { Observable } from "rxjs";
import { map } from 'rxjs/operators';

import { ConfigService } from "app/core/services/config.service";
import { ToastService } from "app/core/services/toast.service";

import { WebConfig } from "app/schema/web-config";
import { WebConfigStructureGroup, WebConfigStructureItem } from 'app/schema/web-config-structure';

import { webConfigStructure } from "app/config/web-config";

@Component({
  selector: 'web-settings',
  templateUrl: './web-settings.component.html',
  styleUrls: ['./web-settings.component.scss']
})
export class WebSettingsComponent implements OnInit {

  viewCategory$ = this.route.params.pipe(map(params => params.cat));

  config$ = this.configService.config;

  configStructure: any = webConfigStructure;

  viewJson: boolean = false;

  constructor(private configService: ConfigService, private toastService: ToastService, private route: ActivatedRoute) { }

  ngOnInit() {

  }

  async saveConfig(form: NgForm) {

    const data: WebConfig = form.value;

    await this.configService.saveConfig(data);

    this.toastService.toast("Uloženo.");

  }

  getConfigValue(category: WebConfigStructureGroup, item: WebConfigStructureItem): Observable<any> {
    return this.config$.pipe(map(config => (config[category.name] && config[category.name][item.name]) || item.default));
  }

}