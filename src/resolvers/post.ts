import { Post } from "../entities/Post";
import { MyContext } from "../types";
import { Resolver, Query, Ctx, Arg, Int, Mutation } from "type-graphql";

@Resolver()
export class PostResolver {
    @Query(() => [Post]) // Types are uppercased
    posts(@Ctx() { em }: MyContext): Promise<Post[]> { // explicit return type, type checking
        return em.find(Post, {});
    }

    @Query(() => Post, { nullable: true }) // can't null obj in ts
    post(
        @Arg('id', () => Int) id: number, // arg name, var name
        @Ctx() { em }: MyContext): Promise<Post | null> { // explicit return type, type checking
        return em.findOne(Post, { id });
    }

    @Mutation(() => Post)
    async createPost(
        @Arg("title", () => String) title: String,
        @Ctx() { em }: MyContext
    ): Promise<Post> {
        const post = em.create(Post, { title });
        await em.persistAndFlush(post);

        return post;
    }

    @Mutation(() => Post)
    async updatePost(
        @Arg("id", () => Int) id: number,
        @Arg("title", () => String) title: string,
        @Ctx() { em }: MyContext
    ): Promise<Post | null> {
        const post = await em.findOne(Post, { id });
        if (!post) {
            return null;
        }
        if (title !== 'undefined') {
            post.title = title;
            await em.persistAndFlush(post);
        }
        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(
        @Arg('id', () => Int) id: number, // arg name, var name
        @Ctx() { em }: MyContext): Promise<Boolean> {
        await em.nativeDelete(Post, { id });
        return true;
    }
}