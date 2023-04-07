import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { LoginCredentialsRoute, LoginGoogleRoute, LoginLinkRoute, LoginSendLinkRoute } from "../acl/login.acl";
import { LoginCredentialsBody, LoginGoogleBody, LoginLinkBody, LoginSendLinkBody } from "../dto/login-body.dto";

@Controller("account/login")
@ApiTags("Account")
@AcController()
export class LoginController {
  @Post("credentials")
  loginUsingCredentials(@Req() req: Request, @Body() body: LoginCredentialsBody) {
    LoginCredentialsRoute.canOrThrow(req, undefined);
  }

  @Post("google")
  loginUsingGoogle(@Req() req: Request, @Body() body: LoginGoogleBody) {
    LoginGoogleRoute.canOrThrow(req, undefined);
  }

  @Post("sendLink")
  sendLoginLink(@Req() req: Request, @Body() body: LoginSendLinkBody) {
    LoginSendLinkRoute.canOrThrow(req, undefined);
  }

  @Post("link")
  loginUsingLink(@Req() req: Request, @Body() body: LoginLinkBody) {
    LoginLinkRoute.canOrThrow(req, undefined);
  }

  @Post("logout")
  logout() {}
}
