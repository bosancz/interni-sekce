import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { map } from "rxjs";
import { Config } from "src/config";
import { EntityStore } from "../entity-store";
import { OptionsStore } from "../options-store";
import { RouteStore } from "../route-store";
import { EntityType } from "../schema/entity-type";
import { MetadataConstant } from "../schema/metadata-constant";
import { RouteStoreItem } from "../schema/route-store-item";

@Injectable()
export class AcLinksInterceptor implements NestInterceptor {
  private logger = new Logger(AcLinksInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((res) => {
        const route = <RouteStoreItem>this.reflector.get(MetadataConstant.route, context.getHandler());

        if (route.acl.options.contains) {
          const req = context.switchToHttp().getRequest<Request>();
          this.addLinksToEntity(req, route.acl.options.contains, Array.isArray(res) ? res : [res]);
        }

        return res;
      }),
    );
  }

  private addLinksToEntity(req: Request, entity: EntityType, docs: any[]) {
    const routes = this.findRoutes(entity);

    for (let doc of docs) {
      this.addLinksToDoc(req, doc, routes);
    }

    const entityStoreItem = EntityStore.find((e) => e.entity === entity);
    if (entityStoreItem) {
      for (let [property, propertyOptions] of Object.entries(entityStoreItem.properties)) {
        const childDocs = docs
          .filter((doc) => property in doc && !!doc[property] && typeof doc[property] === "object")
          .map((doc) => (Array.isArray(doc[property]) ? doc[property] : [doc[property]]))
          .flat();

        this.addLinksToEntity(req, propertyOptions.entity, childDocs);
      }
    }
  }

  private addLinksToDoc(req: Request, doc: any, routes: RouteStoreItem[]): void {
    doc[OptionsStore.linksProperty] = {};

    for (let route of routes) {
      const allowed = route.acl.can(req, doc);
      const applicable = typeof route.acl.options.condition === "function" ? route.acl.options.condition(doc) : true;

      doc[OptionsStore.linksProperty][route.name] = {
        method: route.httpMethod,
        href: this.getPath(route, doc),
        allowed,
        applicable,
      };
    }
  }

  private findRoutes(entity: EntityType) {
    return RouteStore.filter((route) => route.acl.options.linkTo === entity);
  }

  private getPath(route: RouteStoreItem, doc: any) {
    const pathItems = [Config.app.baseUrl, "api", this.getControllerPath(route)];

    if (typeof route.acl.options.path === "function") pathItems.push(String(route.acl.options.path(doc)));
    else pathItems.push(<string>Reflect.getMetadata(MetadataConstant.routePath, route.handler));

    const path = pathItems
      .map((item) => String(item).replace(/^\//, "").replace(/\/$/, ""))
      .filter((item) => !!item)
      .join("/")
      .replace(/\:([a-zA-Z]+)/g, (match, param) => (param in doc ? doc[param] : param));

    return path;
  }

  private getControllerPath(route: RouteStoreItem) {
    const controllerTarget = Reflect.getMetadata(MetadataConstant.controller, route.controller);
    if (!controllerTarget) throw new InternalServerErrorException("Missing AcController decorator.");
    return <string>Reflect.getMetadata(MetadataConstant.controllerPath, controllerTarget) || "";
  }
}
