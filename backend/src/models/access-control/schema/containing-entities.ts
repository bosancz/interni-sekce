export type ContainingEntity = string | ContainingEntityArray | ContainingEntityObject;

export interface ContainingEntityArray extends Array<ContainingEntity> {}
export interface ContainingEntityObject extends Record<string, ContainingEntity> {}
