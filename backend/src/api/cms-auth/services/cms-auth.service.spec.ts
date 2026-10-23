import { Config } from "src/config";
import { CmsAuthService } from "./cms-auth.service";

function createService(cmsAuth: Partial<Config["cmsAuth"]> = {}) {
	const config = {
		cmsAuth: {
			githubClientId: "client",
			githubClientSecret: "secret",
			allowedDomains: ["bosan.cz", "test.bosan.cz"],
			...cmsAuth,
		},
	} as Config;
	return new CmsAuthService(config);
}

describe("CmsAuthService", () => {
	it("allows only the configured domains", () => {
		const service = createService();
		expect(service.isDomainAllowed("test.bosan.cz")).toBe(true);
		expect(service.isDomainAllowed("TEST.bosan.cz")).toBe(true);
		expect(service.isDomainAllowed("evil.cz")).toBe(false);
		expect(service.isDomainAllowed("bosan.cz.evil.cz")).toBe(false);
		expect(service.isDomainAllowed(undefined)).toBe(false);
	});

	it("is not configured without the client secret", () => {
		expect(createService().configured).toBe(true);
		expect(createService({ githubClientSecret: "" }).configured).toBe(false);
	});

	it("redirects to GitHub with the client id, scope and state", () => {
		const url = new URL(createService().getAuthorizeUrl("abc"));
		expect(url.origin + url.pathname).toBe("https://github.com/login/oauth/authorize");
		expect(url.searchParams.get("client_id")).toBe("client");
		expect(url.searchParams.get("scope")).toBe("repo,user");
		expect(url.searchParams.get("state")).toBe("abc");
	});

	it("exchanges the code for a token", async () => {
		const fetchMock = jest
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(new Response(JSON.stringify({ access_token: "gho_token" })));
		await expect(createService().exchangeCode("code")).resolves.toEqual({ token: "gho_token" });
		expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({
			client_id: "client",
			client_secret: "secret",
			code: "code",
		});
		fetchMock.mockRestore();
	});

	it("reports a failed exchange", async () => {
		const fetchMock = jest
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(new Response(JSON.stringify({ error: "bad_verification_code" })));
		await expect(createService().exchangeCode("code")).resolves.toMatchObject({
			errorCode: "TOKEN_REQUEST_FAILED",
		});
		fetchMock.mockRestore();
	});

	it("does not let the token close the script tag", () => {
		const html = createService().renderResult({ token: "</script><script>alert(1)</script>" });
		expect(html.match(/<\/script>/g)).toHaveLength(1);
	});
});
