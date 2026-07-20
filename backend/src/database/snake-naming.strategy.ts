import { DefaultNamingStrategy, NamingStrategyInterface } from "typeorm";

// Vendored from `typeorm-naming-strategies` (https://github.com/tonivj5/typeorm-naming-strategies),
// which doesn't support typeorm 1.x (still requires `typeorm@^0.2.0 || ^0.3.0` as a peer),
// blocking `npm ci` with an unresolvable peer dependency conflict.
function snakeCase(str: string): string {
	return str
		.replace(/([A-Z])([A-Z])([a-z])/g, "$1_$2$3")
		.replace(/([a-z0-9])([A-Z])/g, "$1_$2")
		.toLowerCase();
}

export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
	tableName(className: string, customName: string | undefined): string {
		return customName ? customName : snakeCase(className);
	}

	columnName(propertyName: string, customName: string | undefined, embeddedPrefixes: string[]): string {
		return (
			snakeCase(embeddedPrefixes.concat("").join("_")) + (customName ? customName : snakeCase(propertyName))
		);
	}

	relationName(propertyName: string): string {
		return snakeCase(propertyName);
	}

	joinColumnName(relationName: string, referencedColumnName: string): string {
		return snakeCase(relationName + "_" + referencedColumnName);
	}

	joinTableName(firstTableName: string, secondTableName: string, firstPropertyName: string): string {
		return snakeCase(firstTableName + "_" + firstPropertyName.replace(/\./gi, "_") + "_" + secondTableName);
	}

	joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
		return snakeCase(tableName + "_" + (columnName ? columnName : propertyName));
	}

	classTableInheritanceParentColumnName(parentTableName: string, parentTableIdPropertyName: string): string {
		return snakeCase(parentTableName + "_" + parentTableIdPropertyName);
	}

	eagerJoinRelationAlias(alias: string, propertyPath: string): string {
		return alias + "__" + propertyPath.replace(".", "_");
	}
}
