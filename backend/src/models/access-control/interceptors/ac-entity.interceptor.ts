import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor, RequestMethod } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { map, Observable } from "rxjs";
import { Config } from "src/config";
import { UserToken } from "src/models/auth/schema/user-token";
import { AuthService } from "../../auth/services/auth.service";
import { ChildEntity } from "../schema/child-entities";
import { Document } from "../schema/document";
import { EntityStore, EntityStoreItem } from "../schema/entity-store";
import { AccessControlService } from "../services/access-control.service";

type DocumentResponse<T> = T & Document;

type Response<T> = DocumentResponse<T> | DocumentResponse<T>[];

@Injectable()
export class AcEntityInterceptor<T = any> implements NestInterceptor<T, Response<T>> {
  private logger = new Logger(AcEntityInterceptor.name);

  constructor(private reflector: Reflector, private acService: AccessControlService, private authService: AuthService) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Response<T>> {
    return next.handle().pipe(
      map((res) => {
        const entity = <EntityStoreItem>this.reflector.get("entity", context.getHandler());
        const token = this.authService.getToken(context.switchToHttp().getRequest<Request>());

        if (!Array.isArray(res)) this.addLinksToEntity(res, entity.name, token);

        if (entity.children) this.addLinksToChildren(res, entity.children, token);

        return res;
      }),
    );
  }

  private addLinksToChildren(res: any, child: ChildEntity, token: UserToken) {
    if (child.entity) {
      if (child.isArray && Array.isArray(res)) {
        res.forEach((item, i) => {
          this.addLinksToEntity(res[i], child.entity, token);
        });
      } else {
        this.addLinksToEntity(res, child.entity, token);
      }
    }

    if (child.properties) {
      Object.keys(child.properties).forEach((key) => {
        if (res[key]) this.addLinksToChildren(res[key], child[key], token);
      });
    }
  }

  private addLinksToEntity<D>(doc: D & Partial<Document>, entityName: string, token: UserToken): void {
    doc._links = {};

    for (let route of this.findRoutes(entityName)) {
      if (route.filter && !route.filter(doc)) continue;

      let method = this.getHttpMethod(route);

      doc._links[route.method] = {
        method,
        href: this.getPath(route, doc),
        allowed: this.acService.can(entityName, doc, token),
      };
    }
  }

  private findRoutes(entity: string) {
    const re = new RegExp(`^${entity}(\\:|$)`);
    return EntityStore.filter((e) => re.test(e.name));
  }

  private getHttpMethod(entity: EntityStoreItem) {
    return <"GET" | "POST" | "PUT" | "PATCH" | "DELETE">RequestMethod[Reflect.getMetadata("method", entity.handler)];
  }

  private getPath(entity: EntityStoreItem, doc: any) {
    const controllerTarget = Reflect.getMetadata("controller", entity.controller);
    const controllerPath = <string>Reflect.getMetadata("path", controllerTarget) || "";

    const pathItems = [Config.app.baseUrl, "api", controllerPath];

    if (typeof entity.path === "function") pathItems.push(entity.path(doc));
    else if (typeof entity.path === "string") pathItems.push(entity.path);
    else pathItems.push(<string>Reflect.getMetadata("path", entity.handler));

    const path = pathItems
      .map((item) => String(item).replace(/^\//, "").replace(/\/$/, ""))
      .filter((item) => !!item)
      .join("/");

    return path;
  }
}
