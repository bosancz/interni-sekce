import { NestExpressApplication } from "@nestjs/platform-express";
import * as hbs from "hbs";
import { join } from "path";

export function registerTemplating(app: NestExpressApplication) {
	app.useStaticAssets(join(__dirname, "..", "public"));
	app.setBaseViewsDir(join(__dirname, "..", "views"));
	app.setViewEngine("hbs");
	hbs.registerPartials(join(__dirname, "..", "views/partials")); // Path to partials
	app.set("view options", { layout: "default" }); // Default layout file
}
