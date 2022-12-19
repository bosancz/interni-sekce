import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor, RequestMethod } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { map, Observable } from "rxjs";
import { Config } from "src/config";
import { AuthService } from "../../auth/services/auth.service";
import { ContainingEntity } from "../schema/containing-entities";
import { Document } from "../schema/document";
import { EntitiesStore, EntitiesStoreRoute } from "../schema/entities-store";
import { UserToken } from "../schema/user-token";
import { AccessControlService } from "../services/access-control.service";

type DocumentResponse<T> = T & Document<string, string>;

type Response<T> = DocumentResponse<T> | DocumentResponse<T>[];

@Injectable()
export class AcEntityInterceptor<T = any> implements NestInterceptor<T, Response<T>> {
  private logger = new Logger(AcEntityInterceptor.name);

  constructor(private reflector: Reflector, private acService: AccessControlService, private authService: AuthService) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Response<T>> {
    return next.handle().pipe(
      map((res) => {
        const entity = <string>this.reflector.get("entity", context.getHandler());
        const containingEntities = <ContainingEntity>this.reflector.get("containing-entities", context.getHandler());
        const token = this.authService.getToken(context.switchToHttp().getRequest<Request>());

        this.addLinksToResponse(res, entity, token);

        if (containingEntities) this.addLinksToResponse(res, containingEntities, token);

        return res;
      }),
    );
  }

  private addLinksToResponse(res: any, entities: ContainingEntity, token: UserToken) {
    if (typeof entities === "string" && !Array.isArray(res)) {
      this.addLinksToEntity(res, entities, token);
    }

    if (Array.isArray(entities) && Array.isArray(res)) {
      res.forEach((item, i) => {
        this.addLinksToResponse(res[i], entities[i] ?? entities[0], token);
      });
    }

    if (typeof entities === "object" && typeof res === "object") {
      Object.keys(entities).forEach((key) => {
        if (res[key]) this.addLinksToResponse(res[key], entities[key], token);
      });
    }

    return res;
  }

  private addLinksToEntity<D>(doc: D & Partial<Document<string, string>>, entity: string, token: UserToken): void {
    doc._links = {};

    for (let route of this.findRoutes(entity)) {
      if (route.filter && !route.filter(doc)) continue;

      let method = this.getHttpMethod(route);

      doc._links[route.method] = {
        method,
        href: this.getPath(route, doc),
        allowed: this.acService.can(route.entity, doc, token),
      };
    }
  }

  private findRoutes(entity: string) {
    const re = new RegExp(`^${entity}(\\:|$)`);
    return EntitiesStore.filter((e) => re.test(e.entity));
  }

  private getHttpMethod(route: EntitiesStoreRoute) {
    return <"GET" | "POST" | "PUT" | "PATCH" | "DELETE">RequestMethod[Reflect.getMetadata("method", route.handler)];
  }

  private getPath(route: EntitiesStoreRoute, doc: any) {
    const controllerTarget = Reflect.getMetadata("controller", route.controller);
    const controllerPath = <string>Reflect.getMetadata("path", controllerTarget) || "";

    const pathItems = [Config.app.baseUrl, "api", controllerPath];

    if (typeof route.path === "function") pathItems.push(route.path(doc));
    else if (typeof route.path === "string") pathItems.push(route.path);
    else pathItems.push(<string>Reflect.getMetadata("path", route.handler));

    const path = pathItems
      .map((item) => String(item).replace(/^\//, "").replace(/\/$/, ""))
      .filter((item) => !!item)
      .join("/");

    return path;
  }
}
