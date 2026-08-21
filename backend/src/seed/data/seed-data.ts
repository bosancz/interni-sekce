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

export enum SeedEventSchedules {
	weekend = "weekend",
	longWeekend = "longWeekend",
	week = "week",
}

export interface SeedEvent {
	name: string;
	type: string;
	status: EventStates;
	schedule: SeedEventSchedules;
	weeks: number;
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

export interface SeedPhoto {
	name: string;
	title: string;
	caption: string;
	tags: string[];
}

export interface SeedAlbum {
	name: string;
	description: string;
	status: AlbumStatus;
	dayOffset: number;
	days: number;
	photos: SeedPhoto[];
}

export interface SeedUser {
	login: string;
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
		email: "bilbo@bosan.cz",
		roles: [UserRoles.admin],
		member: "Bilbo",
	},
	{
		login: "vedouci",
		email: "vedouci@bosan.cz",
		roles: [],
		member: "Beorn (vedoucí)",
	},
	{
		login: "instruktor",
		email: "instruktor@bosan.cz",
		roles: [],
		member: "Elrond (instruktor)",
	},
	{
		login: "program",
		email: "program@bosan.cz",
		roles: [UserRoles.program],
		member: "Gandalf (správce programu)",
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
		addressStreet: "Dno Pytle",
		addressStreetNo: "1",
		addressCity: "Hobitín",
		addressPostalCode: "111 01",
	},
	{
		nickname: "Beorn (vedoucí)",
		group: "KP",
		role: MemberRoles.vedouci,
		rank: MemberRanks.vedouci,
		function: "strážce brodu",
		firstName: "Beorn",
		lastName: "z Karrocku",
		birthday: "1978-04-17",
		mobile: "777 000 100",
		email: "beorn@bosan.cz",
	},
	{
		nickname: "Elrond (instruktor)",
		group: "KP",
		role: MemberRoles.instruktor,
		rank: MemberRanks.instruktor,
		function: "znalec run",
		firstName: "Elrond",
		lastName: "Půlelf",
		birthday: "2004-10-03",
		mobile: "777 000 101",
		email: "elrond@bosan.cz",
	},
	{
		nickname: "Gandalf (správce programu)",
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
		name: "Neočekávaný dýchánek",
		type: "schůzka",
		status: EventStates.pending,
		schedule: SeedEventSchedules.weekend,
		weeks: 1,
		place: "Dno Pytle, Hobitín",
		description:
			"První schůzka trpaslíků, Gandalfa a Bilba u Bilba doma. Nikdo ji neohlásil, nikdo ji nevede a spíž to zřejmě neustojí.",
		groups: ["T", "KP"],
		leaders: [],
		attendees: ["Bilbo", "Gandalf (správce programu)", "Thorin", "Balin", "Fíli", "Kíli", "Bombur", "Ori"],
		timeFrom: "18:00",
		timeTill: "pozdě do noci",
		meetingPlaceStart: "u kulatých dveří s runou",
		itemList: "kapesník, nádobí na mytí, píseň na dobrou noc",
	},
	{
		name: "Schůzka U Zeleného draka",
		type: "schůzka",
		status: EventStates.public,
		schedule: SeedEventSchedules.weekend,
		weeks: 2,
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
		schedule: SeedEventSchedules.longWeekend,
		weeks: 3,
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
		schedule: SeedEventSchedules.longWeekend,
		weeks: 5,
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
		schedule: SeedEventSchedules.weekend,
		weeks: 7,
		place: "Kraj",
		description: "Vyjížďka po Kraji se zastávkou na druhou snídani.",
		groups: ["T"],
		leaders: [],
		attendees: ["Fíli", "Kíli", "Ori"],
		timeFrom: "9:00",
		timeTill: "16:00",
		meetingPlaceStart: "Dno Pytle",
		itemList: "kolo, helma, duše",
	},
	{
		name: "Brigáda na opravě Dna Pytle",
		type: "brigáda",
		status: EventStates.draft,
		schedule: SeedEventSchedules.weekend,
		weeks: 9,
		place: "Dno Pytle, Hobitín",
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
		schedule: SeedEventSchedules.week,
		weeks: 17,
		place: "Roklinka",
		description: "Čtrnáctidenní tábor u Elrondových. Kroniky, výpravy a zpěv do noci.",
		groups: ["T", "KP"],
		leaders: ["Thorin", "Bilbo", "Gandalf (správce programu)"],
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
		schedule: SeedEventSchedules.weekend,
		weeks: 4,
		place: "Dlouhé jezero",
		description: "Odpoledne u vody pod Osamělou horou. Plave se, potápí se a nikdo si nebere luk.",
		groups: ["N"],
		leaders: [],
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
		photos: [
			{
				name: "bilbo-pred-pytlikovem.jpg",
				title: "Bilbo před Dnem Pytle",
				caption: "Ráno odjezdu. Kapesník zůstal doma.",
				tags: ["výprava", "Hobitín"],
			},
			{
				name: "gandalf-na-ceste.jpg",
				title: "Gandalf na cestě",
				caption: "Vedoucí nechodí pozdě ani brzy, přichází přesně tehdy, kdy zamýšlí.",
				tags: ["výprava", "vedoucí"],
			},
			{
				name: "thorin-pod-osamelou-horou.jpg",
				title: "Thorin pod Osamělou horou",
				caption: "Nástup před výpravou k Osamělé hoře.",
				tags: ["výprava", "hory"],
			},
			{
				name: "glum-u-jezera.jpg",
				title: "Glum u jezera",
				caption: "U jezera pod Mlžnými horami. Prsten se toho dne nenašel.",
				tags: ["voda", "jezero"],
			},
			{
				name: "bilbo-na-ceste.jpg",
				title: "Bilbo na cestě",
				caption: "Tam a zase zpátky, tentokrát s bagáží.",
				tags: ["výprava"],
			},
		],
	},
];
