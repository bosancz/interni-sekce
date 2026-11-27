import { normalizeRotation, rotateFaceBox } from "./photo-rotation";

describe("normalizeRotation", () => {
	it("wraps angles into 0–270", () => {
		expect(normalizeRotation(0)).toBe(0);
		expect(normalizeRotation(360)).toBe(0);
		expect(normalizeRotation(-90)).toBe(270);
		expect(normalizeRotation(450)).toBe(90);
		expect(normalizeRotation(-180)).toBe(180);
	});
});

describe("rotateFaceBox", () => {
	const box = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };

	const close = (actual: object, expected: object) => {
		for (const [key, value] of Object.entries(expected)) expect((actual as any)[key]).toBeCloseTo(value);
	};

	it("rotates clockwise by 90°", () => {
		close(rotateFaceBox(box, 90), { x: 0.4, y: 0.1, width: 0.4, height: 0.3 });
	});

	it("rotates by 180°", () => {
		close(rotateFaceBox(box, 180), { x: 0.6, y: 0.4, width: 0.3, height: 0.4 });
	});

	it("rotates counter-clockwise by 90°", () => {
		close(rotateFaceBox(box, -90), { x: 0.2, y: 0.6, width: 0.4, height: 0.3 });
	});

	it("returns to the original box after a full turn", () => {
		let rotated = box;
		for (let i = 0; i < 4; i++) rotated = rotateFaceBox(rotated, 90);
		close(rotated, box);
	});
});
