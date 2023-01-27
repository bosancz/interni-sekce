import {
  CallHandler,
  ExecutionContext,
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
import { AcEntity } from "../schema/ac-entity";
import { WithAcLinks } from "../schema/ac-link";
import { AcLinksOptions, ChildEntity } from "../schema/ac-link-options";
import { MetadataConstant } from "../schema/metadata-constant";
import { RouteStore, RouteStoreItem } from "../schema/route-store";
import { AccessControlService } from "../services/access-control.service";

@Injectable()
export class AcLinksInterceptor implements NestInterceptor {
  private logger = new Logger(AcLinksInterceptor.name);

  constructor(private reflector: Reflector, private acService: AccessControlService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((res) => {
        const entity = <AcEntity>this.reflector.get(MetadataConstant.entity, context.getHandler());
        const options = <AcLinksOptions>this.reflector.get(MetadataConstant.linksOptions, context.getHandler());

        const req = context.switchToHttp().getRequest<Request>();

        if (!Array.isArray(res)) this.addLinksToDoc(res, entity, req);

        if (options.contains) this.addLinksToChildren(res, options.contains, req);

        return res;
      }),
    );
  }

  private addLinksToChildren(res: any, child: ChildEntity, req: Request) {
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
        if (res[key]) this.addLinksToChildren(res[key], child.properties![key], req);
      });
    }
  }

  private addLinksToDoc<D>(doc: WithAcLinks<D>, entity: AcEntity, req: Request): void {
    doc._links = {};

    const routes = this.findRoutes(entity);

    for (let route of routes) {
      const entity = <AcEntity>this.reflector.get(MetadataConstant.entity, route.handler);
      const options = <AcLinksOptions>this.reflector.get(MetadataConstant.linksOptions, route.handler);

      const httpMethod = this.getHttpMethod(route);
      const routeName = this.getRouteName(route, options);

      doc._links[routeName] = {
        method: httpMethod,
        href: this.getPath(route, options, doc),
        allowed: this.acService.can(entity, doc, req),
      };
    }
  }

  private findRoutes(entity: AcEntity) {
    const routes: RouteStoreItem[] = [];

    const entityRoute = RouteStore.find((item) => item.entity === entity);
    if (entityRoute) routes.push(entityRoute);

    const childRoutes = RouteStore.filter((item) => item.entity.parent === entity);
    routes.push(...childRoutes);

    return routes;
  }

  private getHttpMethod(route: RouteStoreItem) {
    const methodId = Reflect.getMetadata("method", route.handler);
    return <"GET" | "POST" | "PUT" | "PATCH" | "DELETE">RequestMethod[methodId];
  }

  private getRouteName(route: RouteStoreItem, options: AcLinksOptions) {
    if (options.name) return options.name;
    if (this.acService.options.routeNameConvention)
      return this.acService.options.routeNameConvention(String(route.method));
    else return String(route.method);
  }

  private getPath(route: RouteStoreItem, options: AcLinksOptions, doc: any) {
    const pathItems = [Config.app.baseUrl, "api", this.getControllerPath(route)];

    if (typeof options.path === "function") pathItems.push(String(options.path(doc)));
    else pathItems.push(<string>Reflect.getMetadata("path", route.handler));

    const path = pathItems
      .map((item) => String(item).replace(/^\//, "").replace(/\/$/, ""))
      .filter((item) => !!item)
      .join("/")
      .replace(/\:([a-zA-Z]+)/g, (match, param) => (param in doc ? doc[param] : param));

    return path;
  }

  private getControllerPath(route: RouteStoreItem) {
    const controllerTarget = Reflect.getMetadata("controller", route.controller);
    if (!controllerTarget) throw new InternalServerErrorException("Missing AcController decorator.");
    return <string>Reflect.getMetadata("path", controllerTarget) || "";
  }
}
