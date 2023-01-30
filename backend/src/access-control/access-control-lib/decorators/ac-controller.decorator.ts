import { MetadataConstant } from "../schema/metadata-constant";

/** Marks controller used by Access Control module to allow path linking */
export function AcController(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(MetadataConstant.controller, target, target.prototype);
  };
}
