import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor, RequestMethod } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map, Observable } from "rxjs";
import { Config } from "src/config";
import { EntitiesStore, EntitiesStoreRoute } from "../decorators/ac-entity.decorator";
import { Document } from "../schema/document";
import { Roles } from "../schema/roles";
import { AccessControlService } from "../services/access-control.service";

type DocumentResponse<T> = T & Document<string, string>;

type Response<T> = DocumentResponse<T> | DocumentResponse<T>[];

@Injectable()
export class AcEntityInterceptor<T = any> implements NestInterceptor<T, Response<T>> {
  private logger = new Logger(AcEntityInterceptor.name);

  constructor(private reflector: Reflector, private acService: AccessControlService) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Response<T>> {
    return next.handle().pipe(map((res) => this.addLinksToResponse(res, context)));
  }

  private addLinksToResponse(res: T, context: ExecutionContext): Response<T> {
    const entity = this.reflector.get("entity", context.getHandler());
    const role = Roles.clen;

    if (Array.isArray(res)) {
      return res.map((d) => this.addLinksToEntity(d, entity, role));
    } else {
      return this.addLinksToEntity(res, entity, role);
    }
  }

  private addLinksToEntity(document: T, entity: string, role: Roles): DocumentResponse<T> {
    const doc: T & Document<string, string> = {
      ...document,
      _links: {},
    };

    for (let route of this.findRoutes(entity)) {
      let link = route.entity === entity ? "self" : route.entity;
      let method = this.getHttpMethod(route);

      if (!doc._links[link]) doc._links[link] = { allowed: {}, href: this.getPath(route) };

      doc._links[link].allowed[method] = this.acService.canRoute(route.entity, role, { token: {} });
    }

    return doc;
  }

  private findRoutes(entity: string) {
    const re = new RegExp(`^${entity}\\:?`);
    return EntitiesStore.filter((e) => re.test(e.entity));
  }

  private getHttpMethod(route: EntitiesStoreRoute) {
    return RequestMethod[Reflect.getMetadata("method", route.handler)];
  }

  private getPath(route: EntitiesStoreRoute) {
    const controllerTarget = Reflect.getMetadata("controller", route.controller);
    const controllerPath = Reflect.getMetadata("path", controllerTarget) || "";
    const methodPath = Reflect.getMetadata("path", route.handler);

    const pathItems = [Config.app.baseUrl, "api", controllerPath, methodPath];

    const path = pathItems
      .map((item) => item.replace(/^\//, "").replace(/\/$/, ""))
      .filter((item) => !!item)
      .join("/");

    return path;
  }
}
