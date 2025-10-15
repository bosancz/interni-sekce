export interface MembershipStatesMetadata {
	title: string;
}

export const MembershipStates: { [status in BackendApiTypes.MembershipStatesEnum]: MembershipStatesMetadata } = {
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
