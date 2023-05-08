import { Body, Controller, ForbiddenException, NotFoundException, Post, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { UserTokenData } from "src/auth/schema/user-token";
import { HashService } from "src/auth/services/hash.service";
import { LoginService } from "src/auth/services/login.service";
import { TokenService } from "src/auth/services/token.service";
import { UsersService } from "src/models/users/services/users.service";
import { LoginCredentialsRoute, LoginGoogleRoute, LoginLinkRoute, LoginSendLinkRoute } from "../acl/login.acl";
import { LoginCredentialsBody, LoginGoogleBody, LoginLinkBody, LoginSendLinkBody } from "../dto/login-body.dto";

@Controller("login")
@ApiTags("Account")
@AcController()
export class LoginController {
  constructor(
    private userService: UsersService,
    private loginService: LoginService,
    private hashService: HashService,
    private tokenService: TokenService,
  ) {}
  @Post("credentials")
  async loginUsingCredentials(@Req() req: Request, @Res() res: Response, @Body() body: LoginCredentialsBody) {
    LoginCredentialsRoute.canOrThrow(req, undefined);

    const user = await this.userService.getUserByLogin(body.login);
    if (!user) throw new NotFoundException();

    if (!user.password) throw new ForbiddenException();

    const passwordOK = await this.hashService.compareHash(body.password, user.password);

    if (passwordOK) {
      const tokenData: UserTokenData = {
        roles: user.roles ?? [],
        userId: user.id,
      };

      await this.tokenService.setToken(res, tokenData);
    } else {
      throw new ForbiddenException();
    }
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
