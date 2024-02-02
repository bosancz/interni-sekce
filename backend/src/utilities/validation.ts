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
