import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from "@angular/router";
import { Subscription } from "rxjs";

import { DataService } from "../../../services/data.service";
import { ToastService } from "../../../services/toast.service";

import { WebConfig } from "../../../schema/webconfig";

@Component({
  selector: 'web-admin',
  templateUrl: './web-admin.component.html',
  styleUrls: ['./web-admin.component.css']
})
export class WebAdminComponent implements OnInit, OnDestroy {

  cat:string = "about";
  
  groupFields = [
    {"name": "id", "title": "ID", "type": "text"},
    {"name": "name", "title": "Jméno", "type": "text"},
    {"name": "color", "title": "Barva", "type": "text"}
  ];
  
  eventTypeFields = [
    {"name": "id", "title": "ID", "type": "text"},
    {"name": "title", "title": "Název", "type": "text"},
    {"name": "image", "title": "Obrázek", "type": "text"}
  ];
  
  memberRolesFields = [
    {"name": "id", "title": "ID", "type": "text"}
  ];
  
  userRolesFields = [
    {"name": "name", "title": "ID", "type": "text"},
    {"name": "title", "title": "Název", "type": "text"},
    {"name": "description", "title": "Popis", "type": "text"}
  ]
  
  defaultTagsFields = [
    {"name": "tag", "title": "Tag", "type": "text"}
  ];
  
  modified:boolean = false;
  
  config:WebConfig;
  
  viewJson:boolean = false;
  jsonError:boolean = false;
  
  paramsSubscription:Subscription;
  
  constructor(private dataService:DataService, private toastService:ToastService, private route:ActivatedRoute, private router:Router) { }

  ngOnInit() {
    this.paramsSubscription = this.route.params.subscribe((params:Params) => {
      this.cat = params.cat;
    });
    this.loadConfig();
  }
  
  ngOnDestroy(){
    this.paramsSubscription.unsubscribe();
  }
  
  async loadConfig(){
    this.config = await this.dataService.getConfig(true).then(config => JSON.parse(JSON.stringify(config)));
  }
  
  async saveConfig(){
    await this.dataService.saveConfig(this.config);
    await this.loadConfig();
    this.toastService.toast("Uloženo.");
  }
  
  resetConfig(){
    this.loadConfig();
  }
  
  listFromString(string:string):string[]{
    if(!string) return [];
    return string.split(",").map(item => item.trim());
  }
  
  listToString(list:string[]):string{
    if(!list) return "";
    return list.join(",");
  }
    
  
  editJson(json){
    try{
      var config = JSON.parse(json);
      this.jsonError = false;
      this.config = config;
    }
    catch(err){
      this.jsonError = true;
    }
  }

}
