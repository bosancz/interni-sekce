export type EntitiesStoreRoute = {
  entity: string;
  containingEntities?: any;
  method: string;
  controller: any;
  handler: any;
  path?: string | ((doc: any) => string);
  filter?: (doc: any) => boolean;
};

export const EntitiesStore: EntitiesStoreRoute[] = [];
