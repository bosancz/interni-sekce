import { Transform } from "class-transformer";

export function EnsureArray(options: { split?: string } = {}): PropertyDecorator {
	return Transform((param) => {
		if (param.value === undefined) return undefined;
		if (param.value === "") return [];
		if (Array.isArray(param.value)) return param.value.filter((v) => v !== undefined && v !== "");
		if (typeof param.value === "string" && options.split) return param.value.split(options.split);
		return [param.value];
	});
}

export function EnsureBoolean(): PropertyDecorator {
	return Transform((param) => {
		const originalValue = param.obj[param.key];
		if (originalValue === undefined) return undefined;
		if (originalValue === "true") return true;
		if (originalValue === "false") return false;
		return !!originalValue;
	});
}

export function EnsureStringArray(): PropertyDecorator {
	return Transform((param) => {
		if (param.value === undefined || param.value === null) return undefined;
		const values = Array.isArray(param.value) ? param.value : [param.value];
		return values
			.filter((value): value is string => typeof value === "string")
			.map((value) => value.trim())
			.filter((value) => value.length > 0);
	});
}
