import { Controller, Get, Query, Req, Res } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Request, Response } from "express";
import { CmsAuthResult, CmsAuthService } from "../services/cms-auth.service";

const STATE_COOKIE = "cms-auth-state";

@Controller("cms-auth")
@ApiExcludeController()
export class CmsAuthController {
	constructor(private readonly cmsAuthService: CmsAuthService) {}

	@Get("auth")
	auth(@Res() res: Response, @Query("provider") provider?: string, @Query("site_id") siteId?: string) {
		if (provider !== "github") {
			return this.send(res, {
				error: "Podporované je jen přihlášení přes GitHub.",
				errorCode: "UNSUPPORTED_BACKEND",
			});
		}
		if (!this.cmsAuthService.isDomainAllowed(siteId)) {
			return this.send(res, {
				error: "Tahle doména se přes nás přihlásit nemůže.",
				errorCode: "UNSUPPORTED_DOMAIN",
			});
		}
		if (!this.cmsAuthService.configured) {
			return this.send(res, {
				error: "Přihlášení přes GitHub není nastavené.",
				errorCode: "MISCONFIGURED_CLIENT",
			});
		}

		const state = this.cmsAuthService.createState();
		res.cookie(STATE_COOKIE, state, {
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			maxAge: 10 * 60 * 1000,
			path: "/",
		});
		return res.redirect(this.cmsAuthService.getAuthorizeUrl(state));
	}

	@Get("callback")
	async callback(
		@Req() req: Request,
		@Res() res: Response,
		@Query("code") code?: string,
		@Query("state") state?: string,
	) {
		const expectedState: string | undefined = req.cookies?.[STATE_COOKIE];
		res.clearCookie(STATE_COOKIE, { path: "/" });

		if (!code || !state) {
			return this.send(res, { error: "GitHub nevrátil autorizační kód.", errorCode: "AUTH_CODE_REQUEST_FAILED" });
		}
		if (!expectedState || state !== expectedState) {
			return this.send(res, { error: "Přihlášení vypršelo, zkus to znovu.", errorCode: "CSRF_DETECTED" });
		}

		return this.send(res, await this.cmsAuthService.exchangeCode(code));
	}

	private send(res: Response, result: CmsAuthResult) {
		res.setHeader("Cache-Control", "no-store");
		res.type("html").send(this.cmsAuthService.renderResult(result));
	}
}
