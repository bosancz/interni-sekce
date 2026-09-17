export enum BugReportPointerTypes {
	fine = "fine",
	coarse = "coarse",
	both = "both",
	none = "none",
}

export const BugReportPointerLabels: Record<BugReportPointerTypes, string> = {
	[BugReportPointerTypes.fine]: "myš nebo pero (fine)",
	[BugReportPointerTypes.coarse]: "dotyk (coarse)",
	[BugReportPointerTypes.both]: "myš i dotyk (fine + coarse)",
	[BugReportPointerTypes.none]: "žádné (none)",
};
