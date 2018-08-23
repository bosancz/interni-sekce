import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from "@angular/router";
import { NgForm } from "@angular/forms";

import { Subscription } from "rxjs";

import { DataService } from "../../../../services/data.service";
import { ToastService } from "../../../../services/toast.service";

import { User } from "../../../../schema/user";
import { Member } from "../../../../schema/member";

@Component({
  selector: 'user-admin',
  templateUrl: './user-admin.component.html',
  styleUrls: ['./user-admin.component.scss']
})
export class UserAdminComponent implements OnInit {

  user:User;
  
  roles:Array<{name:string, title:string, active:boolean}> = [];
  
  members:Member[] = [];
  
  category:string;
  
  deleteConfirmation:boolean = false;
  
  paramsSubscription:Subscription;
  
  constructor(private dataService:DataService, private toastService:ToastService, private route:ActivatedRoute, private router:Router) { }

  ngOnInit() {
    
    this.paramsSubscription = this.route.params.subscribe((params:Params) => {

      if(params.user && (!this.user || this.user._id !== params.user)) this.loadUser(params.user);
      
      this.category = params.cat;

    });
    
    this.loadRoles();
    
    this.loadMembers();
  }
  
  ngOnDestroy(){
    this.paramsSubscription.unsubscribe();
  }
  
  // DB interaction
  async loadUser(userId:string){
    this.user = await this.dataService.getUser(userId);
    this.updateRoles();
  }
  
  updateRoles():void{
    this.roles.forEach(role => role.active = (this.user.roles.indexOf(role.name) !== -1));
  }
  
  async loadRoles(){
    let config = await this.dataService.getConfig();
    this.roles = config.users.roles.map(role => ({name: role.name, title: role.title, active:false}));
  }
  
  async loadMembers(){
    let members = await this.dataService.getMembers();
    members.sort((a,b) => a.group.localeCompare(b.group) || a.nickname.localeCompare(b.nickname));
    this.members = members;
  }
  
  async saveUser(userForm:NgForm){
    
    var userData = userForm.value;
    
    userData.roles = this.roles.filter(role => role.active).map(role => role.name);
    
    await this.dataService.updateUser(this.user._id,userData);
    
    this.toastService.toast("Uloženo.");
  }
  
  async deleteUser(){
    var name = this.user._id;
    await this.dataService.deleteUser(this.user._id);
    this.toastService.toast("Uživatel " + name + " byl smazán.");
    this.router.navigate(["/interni/uzivatele"]);
  }
  
  hasRole(name:string){
    return this.roles.some(role => role.name === name && role.active === true);     
  }

}
