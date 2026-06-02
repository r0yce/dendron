import { DendronError, StatusCodes } from "@dendronhq/common-all";
import { Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import { getLogger } from "../core";
import { TokenMethods } from "../modules/oauth";

export enum OauthService {
  GOOGLE = "google",
}

const router = Router();
const oauthHandlers: { [key: string]: TokenMethods } = {};

const L = getLogger();
const ctx = "oauth";

function registerOauthHandler(type: OauthService, handler: TokenMethods) {
  oauthHandlers[type.toString()] = handler;
}

router.get(
  "/getToken",
  asyncHandler(async (req: Request, res: Response) => {
    L.info({ ctx, msg: "get:enter" });

    let resp;

    const service = req.query.service;
    const handler =
      typeof service === "string" ? oauthHandlers[service] : undefined;
    if (handler) {
      resp = await handler.getToken({
        code: req.query.code as string,
        connectionId: req.query?.connectionId as string,
      });
    } else {
      throw new DendronError({
        message: "unsupported oauth client: " + req.query.service,
        code: StatusCodes.BAD_REQUEST,
      });
    }

    res.send(resp);
  })
);

router.get(
  "/refreshToken",
  asyncHandler(async (req: Request, res: Response) => {
    L.info({ ctx, msg: "get:enter" });
    let resp;

    const service = req.query.service;
    const handler =
      typeof service === "string" ? oauthHandlers[service] : undefined;
    if (handler) {
      resp = await handler.refreshToken({
        refreshToken: req.query.refreshToken as string,
        connectionId: req.query?.connectionId as string,
      });
    } else {
      throw new DendronError({
        message: "unsupported oauth client: " + req.query.service,
        code: StatusCodes.BAD_REQUEST,
      });
    }

    res.send(resp);
  })
);

export { router as oauthRouter, registerOauthHandler };
