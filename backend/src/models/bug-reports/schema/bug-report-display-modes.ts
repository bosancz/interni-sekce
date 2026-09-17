export enum BugReportDisplayModes {
	browser = "browser",
	standalone = "standalone",
	minimalUi = "minimalUi",
	fullscreen = "fullscreen",
}

export const BugReportDisplayModeLabels: Record<BugReportDisplayModes, string> = {
	[BugReportDisplayModes.browser]: "web v prohlížeči",
	[BugReportDisplayModes.standalone]: "instalovaná aplikace (standalone)",
	[BugReportDisplayModes.minimalUi]: "instalovaná aplikace (minimal-ui)",
	[BugReportDisplayModes.fullscreen]: "instalovaná aplikace (fullscreen)",
};
