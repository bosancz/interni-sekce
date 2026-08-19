import { MetadataConstant } from "../schema/metadata-constant";

export function AcController(): ClassDecorator {
	return (target) => {
		Reflect.defineMetadata(MetadataConstant.controller, target, target.prototype);
	};
}
