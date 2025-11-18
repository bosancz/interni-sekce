import { SDK } from "src/sdk";

export interface MembershipStatesMetadata {
	title: string;
}

export const MembershipStates: { [status in SDK.MembershipStatesEnum]: MembershipStatesMetadata } = {
	clen: {
		title: "Člen",
	},
	neclen: {
		title: "Nečlen",
	},
	pozastaveno: {
		title: "Pozastaveno",
	},
};
