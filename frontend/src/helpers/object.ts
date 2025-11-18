/**
 * Return object that contains only keys specified
 * @param obj
 * @param keys
 * @returns
 */
export function pick<T extends {}, K extends keyof T>(obj: T, keys: K[]) {
	return Object.fromEntries(keys.filter((key) => key in obj).map((key) => [key, obj[key]])) as Pick<T, K>;
}

/**
 * Return object that contains all keys except those specified
 * @param obj
 * @param keys
 * @returns
 */
export function omit<T extends {}, K extends keyof T>(obj: T, keys: K[]) {
	return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key as K))) as Omit<T, K>;
}

export function deepCopy<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}
