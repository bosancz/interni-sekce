export type AttendeeNoteTone = "birthday" | "high" | "medium" | "low" | "unknown" | "neutral";

export interface AttendeeNote {
	tone: AttendeeNoteTone;
	icon: string;
	text: string;
}
