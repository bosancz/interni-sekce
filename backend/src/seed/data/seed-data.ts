import { AlbumStatus } from "src/models/albums/entities/album.entity";
import { EventExpenseTypes } from "src/models/events/entities/event-expense.entity";
import { EventStates } from "src/models/events/entities/event.entity";
import {
	HealthEntry,
	HealthSeverity,
	MemberRanks,
	MemberRoles,
	MembershipStates,
} from "src/models/members/entities/member.entity";
import { UserRoles } from "src/models/users/entities/user.entity";

export interface SeedGroup {
	shortName: string;
	name: string;
	color: string;
	active: boolean;
}

export interface SeedMemberContact {
	relationship: string;
	name?: string;
	mobile?: string;
	email?: string;
	other?: string;
}

export interface SeedMember {
	nickname: string;
	group: string;
	role: MemberRoles;
	rank?: MemberRanks;
	function?: string;
	firstName?: string;
	lastName?: string;
	birthday?: string;
	mobile?: string;
	email?: string;
	addressStreet?: string;
	addressStreetNo?: string;
	addressCity?: string;
	addressPostalCode?: string;
	membership?: MembershipStates;
	active?: boolean;
	knownProblems?: HealthEntry[];
	allergies?: HealthEntry[];
	contacts?: SeedMemberContact[];
}

export interface SeedEventExpense {
	receiptNumber: string;
	amount: number;
	type: EventExpenseTypes;
	description: string;
}

export interface SeedEvent {
	name: string;
	type: string;
	status: EventStates;
	dayOffset: number;
	days: number;
	place: string;
	description: string;
	groups: string[];
	leaders: string[];
	attendees: string[];
	timeFrom?: string;
	timeTill?: string;
	meetingPlaceStart?: string;
	meetingPlaceEnd?: string;
	price?: number;
	itemList?: string;
	river?: string;
	waterKm?: number;
	leadersEvent?: boolean;
	hasRegistration?: boolean;
	expenses?: SeedEventExpense[];
}

export interface SeedAlbum {
	name: string;
	description: string;
	status: AlbumStatus;
	dayOffset: number;
	days: number;
}

export interface SeedUser {
	login: string;
	password: string;
	email: string;
	roles: UserRoles[];
	member: string;
}

export const SeedGroups: SeedGroup[] = [
	{ shortName: "T", name: "Trpaslíci", color: "#FEC503", active: true },
	{ shortName: "N", name: "Nepřátelé", color: "#8B0000", active: true },
	{ shortName: "KP", name: "Klub přátel", color: "#0F0F0F", active: true },
];

export const SeedUsers: SeedUser[] = [
	{
		login: "bilbo",
		password: "gandalf",
		email: "bilbo@bosan.cz",
		roles: [UserRoles.admin],
		member: "Bilbo",
	},
	{
		login: "vedouci",
		password: "gandalf",
		email: "vedouci@bosan.cz",
		roles: [],
		member: "Vedoucí",
	},
	{
		login: "instruktor",
		password: "gandalf",
		email: "instruktor@bosan.cz",
		roles: [],
		member: "Instruktor",
	},
	{
		login: "program",
		password: "gandalf",
		email: "program@bosan.cz",
		roles: [UserRoles.program],
		member: "Správce programu",
	},
];

export const SeedMembers: SeedMember[] = [
	{
		nickname: "Bilbo",
		group: "KP",
		role: MemberRoles.vedouci,
		rank: MemberRanks.vedouci,
		function: "kronikář",
		firstName: "Bilbo",
		lastName: "Pytlík",
		birthday: "1980-09-22",
		mobile: "777 123 456",
		email: "bilbo@bosan.cz",
		addressStreet: "Pytlíkov",
		addressStreetNo: "1",
		addressCity: "Hobitín",
		addressPostalCode: "111 01",
	},
	{
		nickname: "Vedoucí",
		group: "KP",
		role: MemberRoles.vedouci,
		rank: MemberRanks.vedouci,
		function: "testovací vedoucí",
		firstName: "Testovací",
		lastName: "Vedoucí",
		birthday: "1990-01-01",
		mobile: "777 000 100",
		email: "vedouci@bosan.cz",
	},
	{
		nickname: "Instruktor",
		group: "KP",
		role: MemberRoles.instruktor,
		rank: MemberRanks.instruktor,
		function: "testovací instruktor",
		firstName: "Testovací",
		lastName: "Instruktor",
		birthday: "2005-01-01",
		mobile: "777 000 101",
		email: "instruktor@bosan.cz",
	},
	{
		nickname: "Správce programu",
		group: "KP",
		role: MemberRoles.vedouci,
		rank: MemberRanks.vedouci,
		function: "správce programu",
		firstName: "Testovací",
		lastName: "Správce",
		birthday: "1990-01-01",
		mobile: "777 000 102",
		email: "program@bosan.cz",
	},
	{
		nickname: "Gandalf",
		group: "KP",
		role: MemberRoles.vedouci,
		rank: MemberRanks.vedouci,
		function: "nositel ohně",
		firstName: "Gandalf",
		lastName: "Šedý",
		birthday: "1950-01-01",
		mobile: "777 000 001",
		email: "gandalf@bosan.cz",
	},
	{
		nickname: "Thorin",
		group: "T",
		role: MemberRoles.vedouci,
		rank: MemberRanks.vedouci,
		function: "vedoucí oddílu",
		firstName: "Thorin",
		lastName: "Pavéza",
		birthday: "1975-03-08",
		mobile: "777 000 002",
		email: "thorin@bosan.cz",
		addressStreet: "Osamělá hora",
		addressStreetNo: "1",
		addressCity: "Království pod Horou",
		addressPostalCode: "222 02",
	},
	{
		nickname: "Balin",
		group: "T",
		role: MemberRoles.instruktor,
		rank: MemberRanks.instruktor,
		function: "kvartýrmajstr",
		firstName: "Balin",
		lastName: "Fundinsson",
		birthday: "2004-05-14",
		mobile: "777 000 003",
		email: "balin@bosan.cz",
	},
	{
		nickname: "Fíli",
		group: "T",
		role: MemberRoles.dite,
		firstName: "Fíli",
		lastName: "Dísson",
		birthday: "2012-06-30",
		addressStreet: "Modré hory",
		addressStreetNo: "7",
		addressCity: "Ered Luin",
		addressPostalCode: "333 03",
		contacts: [{ relationship: "Matka", name: "Dís", mobile: "777 000 010", email: "dis@bosan.cz" }],
	},
	{
		nickname: "Kíli",
		group: "T",
		role: MemberRoles.dite,
		firstName: "Kíli",
		lastName: "Dísson",
		birthday: "2014-02-11",
		addressStreet: "Modré hory",
		addressStreetNo: "7",
		addressCity: "Ered Luin",
		addressPostalCode: "333 03",
		contacts: [{ relationship: "Matka", name: "Dís", mobile: "777 000 010", email: "dis@bosan.cz" }],
	},
	{
		nickname: "Bombur",
		group: "T",
		role: MemberRoles.dite,
		firstName: "Bombur",
		lastName: "Bofursson",
		birthday: "2013-11-02",
		allergies: [{ name: "lískové oříšky", severity: HealthSeverity.high }],
		knownProblems: [{ name: "nesnáší dlouhý pochod bez druhé snídaně", severity: HealthSeverity.low }],
		contacts: [
			{ relationship: "Otec", name: "Bofur", mobile: "777 000 011" },
			{ relationship: "Matka", name: "Bifur", mobile: "777 000 012", email: "bifur@bosan.cz" },
		],
	},
	{
		nickname: "Ori",
		group: "T",
		role: MemberRoles.dite,
		firstName: "Ori",
		lastName: "Dorisson",
		birthday: "2015-08-19",
		membership: MembershipStates.pozastaveno,
		contacts: [{ relationship: "Otec", name: "Dori", mobile: "777 000 013" }],
	},
	{
		nickname: "Šmak",
		group: "N",
		role: MemberRoles.vedouci,
		rank: MemberRanks.vedouci,
		function: "vedoucí oddílu",
		firstName: "Šmak",
		lastName: "Zlatý",
		birthday: "1940-12-01",
		mobile: "777 000 020",
		email: "smak@bosan.cz",
		addressStreet: "Poklad pod Horou",
		addressStreetNo: "1",
		addressCity: "Osamělá hora",
		addressPostalCode: "444 04",
	},
	{
		nickname: "Azog",
		group: "N",
		role: MemberRoles.instruktor,
		rank: MemberRanks.instruktor,
		function: "náčelník skřetů",
		firstName: "Azog",
		lastName: "Poskvrnitel",
		birthday: "2003-04-04",
		mobile: "777 000 021",
		email: "azog@bosan.cz",
	},
	{
		nickname: "Velký skřet",
		group: "N",
		role: MemberRoles.vedouci,
		rank: MemberRanks.vedouci,
		function: "hospodář",
		firstName: "Velký",
		lastName: "Skřet",
		birthday: "1968-10-31",
		mobile: "777 000 022",
		active: false,
	},
	{
		nickname: "Bolg",
		group: "N",
		role: MemberRoles.dite,
		firstName: "Bolg",
		lastName: "Azogsson",
		birthday: "2012-09-09",
		contacts: [{ relationship: "Otec", name: "Azog", mobile: "777 000 021", email: "azog@bosan.cz" }],
	},
	{
		nickname: "Glum",
		group: "N",
		role: MemberRoles.dite,
		firstName: "Sméagol",
		birthday: "2011-01-13",
		membership: MembershipStates.neclen,
		allergies: [{ name: "sluneční světlo", severity: HealthSeverity.medium }],
		knownProblems: [{ name: "mluví sám se sebou, ztrácí prsteny", severity: HealthSeverity.low }],
		contacts: [{ relationship: "Jiný", name: "Děagol", other: "nedostupný" }],
	},
];

export const SeedEvents: SeedEvent[] = [
	{
		name: "Schůzka U Zeleného draka",
		type: "schůzka",
		status: EventStates.public,
		dayOffset: 7,
		days: 1,
		place: "Hobitín, hostinec U Zeleného draka",
		description: "Pravidelná schůzka oddílu. Hraje se, plánuje se výprava a povídá se o dracích.",
		groups: ["T"],
		leaders: ["Bilbo"],
		attendees: ["Fíli", "Kíli", "Bombur", "Ori"],
		timeFrom: "17:00",
		timeTill: "19:00",
		meetingPlaceStart: "před hostincem",
		meetingPlaceEnd: "před hostincem",
		itemList: "přezůvky, svačina",
	},
	{
		name: "Výprava k Osamělé hoře",
		type: "peší výlet",
		status: EventStates.public,
		dayOffset: 21,
		days: 3,
		place: "Osamělá hora",
		description: "Třídenní putování přes Divočinu. Spí se pod širákem, vaří se na ohni.",
		groups: ["T"],
		leaders: ["Thorin", "Bilbo"],
		attendees: ["Balin", "Fíli", "Kíli", "Bombur"],
		timeFrom: "8:00",
		timeTill: "odpoledne",
		meetingPlaceStart: "Hlavní nádraží",
		meetingPlaceEnd: "Hlavní nádraží",
		price: 450,
		itemList: "spacák, karimatka, ešus, pláštěnka",
	},
	{
		name: "Splutí Lesní řeky",
		type: "voda",
		status: EventStates.public,
		dayOffset: 35,
		days: 2,
		place: "Temný hvozd",
		description: "Sjezd Lesní řeky na kánoích a v prázdných sudech od vína.",
		groups: ["T"],
		leaders: ["Thorin"],
		attendees: ["Balin", "Fíli", "Kíli"],
		river: "Lesní řeka",
		waterKm: 42,
		timeFrom: "9:00",
		price: 600,
		itemList: "plavky, ručník, boty do vody",
	},
	{
		name: "Cyklovýlet přes Kraj",
		type: "cyklo",
		status: EventStates.pending,
		dayOffset: 49,
		days: 1,
		place: "Kraj",
		description: "Vyjížďka po Kraji se zastávkou na druhou snídani.",
		groups: ["T"],
		leaders: ["Bilbo"],
		attendees: ["Fíli", "Kíli", "Ori"],
		timeFrom: "9:00",
		timeTill: "16:00",
		meetingPlaceStart: "Pytlíkov",
		itemList: "kolo, helma, duše",
	},
	{
		name: "Brigáda na opravě Pytlíkova",
		type: "brigáda",
		status: EventStates.draft,
		dayOffset: 63,
		days: 1,
		place: "Pytlíkov, Hobitín",
		description: "Po nečekané návštěvě je potřeba spravit dveře, nádobí a spíž.",
		groups: ["T"],
		leaders: ["Bilbo", "Thorin"],
		attendees: ["Balin"],
		leadersEvent: true,
		timeFrom: "10:00",
	},
	{
		name: "Tábor v Roklince",
		type: "tábor",
		status: EventStates.public,
		dayOffset: 120,
		days: 14,
		place: "Roklinka",
		description: "Čtrnáctidenní tábor u Elrondových. Kroniky, výpravy a zpěv do noci.",
		groups: ["T", "KP"],
		leaders: ["Thorin", "Bilbo", "Gandalf"],
		attendees: ["Balin", "Fíli", "Kíli", "Bombur", "Ori"],
		hasRegistration: true,
		price: 4200,
		timeFrom: "8:00",
		timeTill: "12:00",
		meetingPlaceStart: "Hlavní nádraží",
		meetingPlaceEnd: "Hlavní nádraží",
		itemList: "spacák, baterka, ešus, prsten neviditelnosti",
		expenses: [
			{
				receiptNumber: "V1",
				amount: 3200,
				type: EventExpenseTypes.food,
				description: "Zásoby na cestu",
			},
			{
				receiptNumber: "V2",
				amount: 250,
				type: EventExpenseTypes.other,
				description: "Tabák do Gandalfovy dýmky",
			},
			{
				receiptNumber: "V3",
				amount: 1800,
				type: EventExpenseTypes.transport,
				description: "Doprava k Mlžným horám",
			},
		],
	},
	{
		name: "Koupání v Dlouhém jezeře",
		type: "bazén",
		status: EventStates.public,
		dayOffset: 28,
		days: 1,
		place: "Dlouhé jezero",
		description: "Odpoledne u vody pod Osamělou horou. Plave se, potápí se a nikdo si nebere luk.",
		groups: ["N"],
		leaders: ["Šmak"],
		attendees: ["Azog", "Bolg", "Glum"],
		timeFrom: "14:00",
		timeTill: "18:00",
		meetingPlaceStart: "Město na jezeře",
		itemList: "plavky, ručník, šupinové brnění",
	},
];

export const SeedAlbums: SeedAlbum[] = [
	{
		name: "Nečekaná cesta",
		description: "Fotky z loňské výpravy tam a zase zpátky. Fotil Ori, komentoval Bombur.",
		status: AlbumStatus.public,
		dayOffset: -180,
		days: 3,
	},
];
