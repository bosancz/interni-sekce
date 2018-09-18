import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

import { AuthService } from "../../services/auth.service";
import { DataService } from "../../services/data.service";
import { ToastService } from "../../services/toast.service";
import { GoogleService } from "../../services/google.service";

@Component({
  selector: 'login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent implements OnInit {
  
  expired:boolean = false;
  
  loginValue:string = "";
  
  status:string = null
  error:Error;
  
  forgotPassword:boolean = false;

  constructor(public loginModal: BsModalRef, private authService:AuthService, private dataService:DataService, private router:Router, private toastService:ToastService, private googleService:GoogleService) {
  }

  ngOnInit() {
  }
  
  async login(loginForm:NgForm){
    
    this.status = null;
    
    var loginData = loginForm.value;

    try{
      var user = await this.authService.login(loginData)
      this.loginModal.hide();
      this.router.navigate(["/interni"]);
    }
    catch(err){
      if(err.status === 401) this.status = "invalidCredentials";
      else throw err;
    }
  }
  
  async googleLogin(){
    
    try{
      var token = await this.googleService.signIn()
      await this.authService.googleLogin(token);
    }
    catch(err){
      this.toastService.toast("Přihlášení přes Google se nezdařilo.");
    }
    
    this.loginModal.hide();
    
  }
  
  async googleLogout(){
    await this.googleService.signOut();
  }
  
  async loginLink(form:NgForm){
    
    var formData = form.value;
    
    try{
      
      this.status = null;
      
      await this.authService.sendToken(formData.login);
      
      this.status = "linkSent";
      
    }
    catch(err){
      if(err.status === 404) this.status = "userNotFound";
      else {
        this.status = "error";
        this.error = err;
      }
    }
    
  }
  

}
