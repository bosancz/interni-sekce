export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type MethodOf<T> = {
  [P in keyof T]: T[P] extends Function ? P : never;
}[keyof T];

export type ExtractExisting<T, K extends T> = Extract<T, K>;
