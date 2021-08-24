import { Connection, EntityManager, IDatabaseDriver } from "@mikro-orm/core";
import { Request, Response } from "express";
import { SessionData } from "express-session";

// session.WhateverProperty was removed in recent express version.
// this seems to be the way to add props now
declare module 'express-session' {
    interface SessionData {
        userId?: number;
        randomSecret?: string;
    }
}

export type MyContext = {
    em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
    req: Request & { session: SessionData };
    res: Response;
}