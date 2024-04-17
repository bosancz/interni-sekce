import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { ConversationResponse } from "../dto/ConversationResponse.dto";
import { Conversation } from "../entities/conversation.entity";

export const ConversationsListRoute = new RouteACL<undefined>({
  linkTo: RootResponse,
  contains: ConversationResponse,

  permissions: {
    admin: true,
    vedouci: true,
  },
});

export const ConversationCreateRoute = new RouteACL<undefined>({
  linkTo: RootResponse,
  contains: ConversationResponse,
  inheritPermissions: ConversationsListRoute,
});

export const ConversationReadRoute = new RouteACL<Conversation>({
  linkTo: ConversationResponse,
  contains: ConversationResponse,
  permissions: {
    admin: true,
    vedouci: true,
  },
});

export const ConversationChatRoute = new RouteACL<Conversation>({
  linkTo: ConversationResponse,
  inheritPermissions: ConversationReadRoute,
});
