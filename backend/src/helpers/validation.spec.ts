import "reflect-metadata";
import { plainToInstance, Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, validateSync } from "class-validator";
import { EnsureArray } from "./validation";

enum Color {
	red = "red",
	blue = "blue",
}

class Query {
	@EnsureArray({ split: "," })
	@Type(() => Number)
	@IsInt({ each: true })
	@IsOptional()
	ids?: number[];

	@EnsureArray({ split: "," })
	@IsEnum(Color, { each: true })
	@IsOptional()
	colors?: Color[];
}

function parse(plain: Record<string, unknown>) {
	const query = plainToInstance(Query, plain);
	return { query, errors: validateSync(query) };
}

describe("EnsureArray", () => {
	it("splits a comma separated list of numbers", () => {
		const { query, errors } = parse({ ids: "1,2" });
		expect(query.ids).toEqual([1, 2]);
		expect(errors).toHaveLength(0);
	});

	it("keeps a single number", () => {
		expect(parse({ ids: "3" }).query.ids).toEqual([3]);
	});

	it("converts repeated parameters", () => {
		const { query, errors } = parse({ ids: ["1", "2"] });
		expect(query.ids).toEqual([1, 2]);
		expect(errors).toHaveLength(0);
	});

	it("rejects a list with a non-number", () => {
		expect(parse({ ids: "1,x" }).errors).toHaveLength(1);
	});

	it("turns an empty string into an empty array", () => {
		expect(parse({ ids: "" }).query.ids).toEqual([]);
	});

	it("leaves a missing value undefined", () => {
		expect(parse({}).query.ids).toBeUndefined();
	});

	it("splits strings", () => {
		const { query, errors } = parse({ colors: "red,blue" });
		expect(query.colors).toEqual(["red", "blue"]);
		expect(errors).toHaveLength(0);
	});
});
