export interface EntityStoreItem {
  entity: any;
  properties: {
    [property: string]: {
      entity: any;
      isArray?: boolean;
    };
  };
}
