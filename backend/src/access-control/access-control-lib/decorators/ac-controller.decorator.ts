/** Marks controller used by Access Control module to allow path linking */
export function AcController(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata("controller", target, target.prototype);
  };
}
