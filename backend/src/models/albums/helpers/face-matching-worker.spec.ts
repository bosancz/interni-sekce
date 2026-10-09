import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { MatchFacesResult, PhotoFaceAssignment } from "../schema/detected-faces";
import {
	FaceMatchingJobRunner,
	FaceMatchingWorkerRun,
	joinVectors,
	VectorFaceReference,
	VectorPhotoFace,
} from "./face-matching-worker";

const WORKER_DIR = join(__dirname, "../../../../../worker");

const PYTHON_MATCH = `
import base64, json, sys
sys.path.insert(0, sys.argv[1])
import numpy as np
from worker.tasks.match_faces import _matrix, match
data = json.load(sys.stdin)
references = _matrix(base64.b64decode(data["references"]), data["dimensions"])
faces = _matrix(base64.b64decode(data["faces"]), data["dimensions"])
members, scores, second = match(references, np.asarray(data["memberIds"], dtype=np.int64), faces, data["excluded"])
json.dump({"memberIds": members, "scores": scores, "secondScores": second}, sys.stdout)
`;

function findPython() {
	const candidates = [process.env["WORKER_PYTHON"], join(WORKER_DIR, ".venv/bin/python"), "python3"];
	return candidates.find(
		(python) =>
			python &&
			(python === "python3" || existsSync(python)) &&
			spawnSync(python, ["-c", "import numpy, bullmq, redis"]).status === 0,
	);
}

function vector(...values: number[]) {
	const length = Math.hypot(...values);
	const buffer = Buffer.alloc(4 + values.length * 4);
	buffer.writeInt16BE(values.length, 0);
	values.forEach((value, i) => buffer.writeFloatBE(value / length, 4 + i * 4));
	return buffer;
}

function face(id: number, descriptor: Buffer | null, overrides: Partial<VectorPhotoFace> = {}): VectorPhotoFace {
	return { id, memberId: null, assignment: null, descriptor, ...overrides };
}

function pythonRunner(python: string, references: VectorFaceReference[]): FaceMatchingJobRunner {
	return {
		async runJob(run, name, data): Promise<MatchFacesResult> {
			const result = spawnSync(python, ["-c", PYTHON_MATCH, WORKER_DIR], {
				input: JSON.stringify({
					dimensions: run.dimensions,
					references: joinVectors(references.map((reference) => reference.descriptor)).toString("base64"),
					memberIds: run.referenceMemberIds,
					faces: joinVectors(data.faces).toString("base64"),
					excluded: data.excluded,
				}),
				maxBuffer: 64 * 1024 * 1024,
			});
			if (result.status !== 0) throw new Error(result.stderr.toString());
			return JSON.parse(result.stdout.toString());
		},
		async deleteKeys() {},
	};
}

const python = findPython();

(python ? describe : describe.skip)("face matching in the worker", () => {
	const alice = vector(1, 0, 0);
	const bob = vector(0, 1, 0);
	const references: VectorFaceReference[] = [
		{ memberId: 1, descriptor: alice },
		{ memberId: 1, descriptor: vector(1, 0, 0.3) },
		{ memberId: 2, descriptor: bob },
	];

	function findCandidates(photos: VectorPhotoFace[][], refs = references) {
		const run = new FaceMatchingWorkerRun(
			pythonRunner(python!, refs),
			"test",
			3,
			refs.map((reference) => reference.memberId),
		);
		return run.findPhotosCandidates(photos);
	}

	it("finds the best member by its best reference, and the runner-up", async () => {
		const candidates = await findCandidates([[face(10, vector(0.3, 0.1, 1))]]);

		expect(candidates.get(10)?.memberId).toBe(1);
		expect(candidates.get(10)!.score).toBeCloseTo((0.3 + 0.3) / Math.hypot(0.3, 0.1, 1) / Math.hypot(1, 0.3), 5);
		expect(candidates.get(10)!.secondScore).toBeCloseTo(0.1 / Math.hypot(0.3, 0.1, 1), 5);
	});

	it("skips members assigned manually on the same photo only", async () => {
		const candidates = await findCandidates([
			[face(10, vector(1, 0.1, 0)), face(11, null, { memberId: 1, assignment: PhotoFaceAssignment.manual })],
			[face(20, vector(1, 0.1, 0))],
		]);

		expect(candidates.get(10)).toEqual({ memberId: 2, score: expect.any(Number), secondScore: null });
		expect(candidates.has(11)).toBe(false);
		expect(candidates.get(20)?.memberId).toBe(1);
	});

	it("has no candidate when every member is excluded", async () => {
		const candidates = await findCandidates([
			[
				face(10, alice),
				face(11, alice, { memberId: 1, assignment: PhotoFaceAssignment.manual }),
				face(12, bob, { memberId: 2, assignment: PhotoFaceAssignment.manual }),
			],
		]);

		expect(candidates.get(10)).toBeNull();
	});

	it("leaves out faces with a different dimension", async () => {
		const candidates = await findCandidates([[face(10, vector(1, 0)), face(11, alice)]]);

		expect(candidates.get(10)).toBeNull();
		expect(candidates.get(11)?.memberId).toBe(1);
	});

	it("never proposes a member assigned manually on the same photo", async () => {
		let seed = 42;
		const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31) * 2 - 1;
		const randomVector = () => vector(...Array.from({ length: 16 }, rand));

		const refs: VectorFaceReference[] = Array.from({ length: 60 }, (_, i) => ({
			memberId: (i % 20) + 1,
			descriptor: randomVector(),
		}));
		let faceId = 1;
		const photos = Array.from({ length: 200 }, () =>
			Array.from({ length: 4 }, () => {
				const manual = rand() > 0.4;
				return face(faceId++, randomVector(), {
					memberId: manual ? Math.floor((rand() + 1) * 10) + 1 : null,
					assignment: manual ? PhotoFaceAssignment.manual : null,
				});
			}),
		);

		const run = new FaceMatchingWorkerRun(
			pythonRunner(python!, refs),
			"test",
			16,
			refs.map((reference) => reference.memberId),
		);
		const candidates = await run.findPhotosCandidates(photos);

		let found = 0;
		for (const photo of photos) {
			const manual = new Set(
				photo.filter((f) => f.assignment === PhotoFaceAssignment.manual).map((f) => f.memberId),
			);
			for (const f of photo) {
				const candidate = candidates.get(f.id);
				if (!candidate) continue;
				found++;
				expect(manual.has(candidate.memberId)).toBe(false);
			}
		}
		expect(found).toBeGreaterThan(100);
	});
});
