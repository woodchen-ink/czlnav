import { api } from "../../server/app";
import { readEnv } from "../../server/env";

export function onRequest(context: { request: Request; env?: unknown }): Promise<Response> {
  return api.handle(context.request, readEnv(context.env));
}
