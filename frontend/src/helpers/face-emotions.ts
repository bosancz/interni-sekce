import { SDK } from "src/sdk";

export const FACE_EMOTIONS: Record<SDK.FaceEmotionEnum, { label: string; emoji: string }> = {
	angry: { label: "naštvaný", emoji: "😠" },
	disgust: { label: "znechucený", emoji: "🤢" },
	fearful: { label: "vystrašený", emoji: "😨" },
	happy: { label: "usměvavý", emoji: "😊" },
	neutral: { label: "neutrální", emoji: "😐" },
	sad: { label: "smutný", emoji: "😢" },
	surprised: { label: "překvapený", emoji: "😮" },
};

export function faceEmotionLabel(face: {
	emotion?: SDK.FaceEmotionEnum | null;
	emotions?: SDK.FaceEmotionsResponse | null;
}): string | null {
	if (!face.emotion) return null;
	const emotion = FACE_EMOTIONS[face.emotion];
	const score = face.emotions?.[face.emotion];
	return `${emotion.emoji} ${emotion.label}${score != null ? ` ${Math.round(score * 100)} %` : ""}`;
}

export function faceHappiness(face: { emotions?: SDK.FaceEmotionsResponse | null }): number {
	return face.emotions?.happy ?? 0;
}
