export class Config {
	production = true;

	apiRoot = "/";

	jwtDomains = ["bosan.cz"];

	// Public "Web application" OAuth client id for "Sign in with Google". Safe to ship in the
	// frontend — only the client *secret* is confidential, and this flow never uses one. The
	// backend can override it through the /api info endpoint (googleClientId).
	googleClientId = "249555539983-j8rvff7bovgnecsmjffe0a3dj55j33hh.apps.googleusercontent.com";
}
