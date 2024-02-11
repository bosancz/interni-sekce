import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { DateTime } from "luxon";
import { AcController } from "src/access-control/access-control-lib";
import { UserData } from "src/auth/schema/user-token";
import { HashService } from "src/auth/services/hash.service";
import { TokenService } from "src/auth/services/token.service";
import { Config } from "src/config";
import { GoogleService } from "src/models/google/services/google.service";
import { MailService } from "src/models/mail/services/mail.service";
import { User } from "src/models/users/entities/user.entity";
import { UsersRepository } from "src/models/users/repositories/users.repository";
import { LoginCredentialsRoute, LoginGoogleRoute, LoginLinkRoute, LoginSendLinkRoute } from "../acl/login.acl";
import { LoginCredentialsBody, LoginGoogleBody, LoginLinkBody, LoginSendLinkBody } from "../dto/login-body.dto";
import { SendLoginLinkMailTemplate } from "../mail-templates/send-login-link/send-login-link.mail-template";

@Controller("login")
@ApiTags("Account")
@AcController()
export class LoginController {
  constructor(
    private userService: UsersRepository,
    private hashService: HashService,
    private tokenService: TokenService,
    private mailService: MailService,
    private googleService: GoogleService,
  ) {}
  @Post("credentials")
  async loginUsingCredentials(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: LoginCredentialsBody,
  ) {
    const user = await this.userService.findUser({ login: body.login.toLocaleLowerCase() }, { credentials: true });
    if (!user) throw new NotFoundException();

    LoginCredentialsRoute.canOrThrow(req, user);

    if (!user.password) throw new ConflictException();

    const passwordOK = await this.hashService.compareHash(body.password, user.password);

    if (passwordOK) await this.setLoginToken(res, user);
    else throw new ForbiddenException();
  }

  @Post("google")
  async loginUsingGoogle(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: LoginGoogleBody,
  ) {
    const tokenInfo = await this.googleService.validateOauthToken(body.token);
    if (!tokenInfo?.email) throw new UnauthorizedException("Email missing in Google user account.");

    const user = await this.userService.findUser({ email: tokenInfo.email });
    if (!user) throw new NotFoundException(`User with email ${tokenInfo.email} not found.`);

    LoginGoogleRoute.canOrThrow(req, user);

    await this.setLoginToken(res, user);
  }

  @Post("sendLink")
  async sendLoginLink(@Req() req: Request, @Body() body: LoginSendLinkBody) {
    const user = await this.userService.findUser([{ login: body.login }, { email: body.login }]);
    if (!user) throw new NotFoundException();
    if (!user.email) throw new ConflictException();

    LoginSendLinkRoute.canOrThrow(req, user);

    const loginCode = this.hashService.generateRandomString();

    this.userService.updateUser(user.id, {
      loginCode: loginCode,
      loginCodeExp: DateTime.local().toISO(),
    });

    const mail = SendLoginLinkMailTemplate(user.email, {
      link: `${Config.app.baseUrl}/api/login/link?code=${loginCode}`,
    });

    await this.mailService.sendMail(mail);
  }

  @Post("link")
  async loginUsingLink(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() body: LoginLinkBody) {
    const user = await this.userService.findUser({ loginCode: body.code }, { credentials: true });
    if (!user || !user.loginCodeExp) throw new NotFoundException();

    LoginLinkRoute.canOrThrow(req, user);

    if (DateTime.fromISO(user.loginCodeExp).diffNow().milliseconds < 0) {
      throw new ForbiddenException("Login code expired");
    }

    this.userService.updateUser(user.id, {
      loginCode: null,
      loginCodeExp: null,
    });

    await this.setLoginToken(res, user);
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    this.tokenService.clearToken(res);
  }

  private async setLoginToken(res: Response, user: User, data?: UserData) {
    const tokenData: UserData = {
      roles: user.roles ?? [],
      userId: user.id,
      memberId: user.memberId ?? undefined,
      ...data,
    };

    await this.tokenService.setToken(res, tokenData);
  }
}
