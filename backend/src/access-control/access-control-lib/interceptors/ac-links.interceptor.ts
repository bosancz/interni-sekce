import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
  RequestMethod,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { map } from "rxjs";
import { Config } from "src/config";
import { AccessControlLibOptions, AcOptions } from "../access-control-lib.module";
import { AcEntity } from "../schema/ac-entity";
import { WithAcLinks } from "../schema/ac-link";
import { AcRouteACL } from "../schema/ac-route-acl";
import { ChildEntity, ChildEntityObject } from "../schema/child-entity";
import { MetadataConstant } from "../schema/metadata-constant";
import { RouteStore, RouteStoreItem } from "../schema/route-store";

@Injectable()
export class AcLinksInterceptor implements NestInterceptor {
  private logger = new Logger(AcLinksInterceptor.name);

  constructor(private reflector: Reflector, @Inject(AcOptions) public options: AccessControlLibOptions) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((res) => {
        const route = <RouteStoreItem>this.reflector.get(MetadataConstant.route, context.getHandler());

        const req = context.switchToHttp().getRequest<Request>();

        this.addLinksToOutput(res, route.acl, req);

        return res;
      }),
    );
  }

  private addLinksToOutput<D>(res: any, routeAcl: AcRouteACL<D>, req: Request) {
    const outputEntities: ChildEntity<any> = routeAcl.options.contains || {};

    // add top level entity to list if not present and result or contains is not an array
    if (routeAcl.options.entity && !Array.isArray(outputEntities))
      (<ChildEntityObject<D>>outputEntities).entity = routeAcl.options.entity;

    this.addLinksToChildren(res, outputEntities, req);
  }

  private addLinksToChildren<D>(res: any, child: ChildEntity<D>, req: Request) {
    if ("array" in child && Array.isArray(res)) {
      res.forEach((item, i) => {
        this.addLinksToChildren(res[i], child.array, req);
      });
      return;
    }

    if ("entity" in child && child.entity) {
      this.addLinksToDoc(res, child.entity, req);
    }

    if ("properties" in child && child.properties) {
      Object.keys(child.properties).forEach((key) => {
        if (res[key]) this.addLinksToChildren(res[<keyof D>key], child.properties![<keyof D>key]!, req);
      });
    }
  }

  private addLinksToDoc<D>(doc: WithAcLinks<D>, entity: AcEntity<D>, req: Request): void {
    doc._links = {};

    const routes = this.findRoutes(entity);

    for (let route of routes) {
      const routeAcl = <RouteStoreItem>this.reflector.get(MetadataConstant.route, route.handler);

      if (typeof route.acl.options.condition === "function" && !route.acl.options.condition(doc)) continue;

      const httpMethod = this.getHttpMethod(route);
      const routeName = this.getRouteName(route);

      doc._links[routeName] = {
        method: httpMethod,
        href: this.getPath(route, doc),
        allowed: route.acl.can(req, doc),
      };
    }
  }

  private findRoutes(entity: AcEntity<any>) {
    return RouteStore.filter((route) => route.acl.options.entity === entity);
  }

  private getHttpMethod(route: RouteStoreItem) {
    const methodId = Reflect.getMetadata("method", route.handler);
    return <"GET" | "POST" | "PUT" | "PATCH" | "DELETE">RequestMethod[methodId];
  }

  private getRouteName(route: RouteStoreItem) {
    if (route.acl.options.name) return route.acl.options.name;
    if (this.options.routeNameConvention) return this.options.routeNameConvention(String(route.method));
    else return String(route.method);
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
