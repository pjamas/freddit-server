import "reflect-metadata";
import { __prod__ } from "./constants";
import { MikroORM } from "@mikro-orm/core";
import mikroConfig from "./mikro-orm.config";
import express from 'express';
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { MyContext } from "./types";
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';


const main = async () => {
    const orm = await MikroORM.init(mikroConfig);
    await orm.getMigrator().up();

    const app = express();

    // Redis on Windows: docker run -p 6379:6379 redis
    // session runs before apollo
    const RedisStore = connectRedis(session)
    const redisClient = redis.createClient() // extract?

    // redisClient.on('ready', () => { console.log("Redis is ready") })

    app.use(
        session({
            name: 'qid',
            store: new RedisStore({
                client: redisClient,
                disableTTL: true,
                disableTouch: true, // no request for ttl extension
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10,//10 years
                httpOnly: true,
                sameSite: 'lax', //csrf
                secure: false && __prod__ // cookie only works in https
            },
            saveUninitialized: false,
            secret: 'somethingrandenvvar',// hide this
            resave: false,
        })
    )

    // session used in apollo
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: ({ req, res }): MyContext => ({
            em: orm.em,
            req,
            res
        }), // make orm entity manager accessible
        plugins: [
            ApolloServerPluginLandingPageGraphQLPlayground(),
        ],
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({ app });

    app.listen(4000, () => {
        console.log('server started on localhost:4000')
    });

}

main().catch((err) => { console.error(err) });