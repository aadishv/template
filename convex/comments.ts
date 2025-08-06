import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const colors: string[] = [
  "rgba(255, 154, 162, 0.7)", // Red (Watermelon)
  "rgba(255, 183, 107, 0.7)", // Orange (Cantaloupe)
  "rgba(255, 229, 127, 0.7)", // Yellow (Banana)
  "rgba(142, 223, 168, 0.7)", // Green (Honeydew)
  "rgba(131, 203, 238, 0.7)", // Blue (Blueberry)
];

export const getUserCommentsForSong = query({
  args: {
    songId: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const comments = await ctx.db
      .query("comments")
      .withIndex("song_and_user", (q) =>
        q.eq("song", args.songId).eq("user", userId),
      )
      .collect();
    // sort by 1) .start, 2) .end
    return comments.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return a.end - b.end;
    });
  },
});

/**
 * Update a comment's title and content, checking user permission.
 */
export const updateComment = mutation({
  args: {
    commentId: v.id("comments"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.user !== userId) throw new Error("Permission denied");
    await ctx.db.patch(args.commentId, {
      title: args.title,
      content: args.content,
    });
    return null;
  },
});

/**
 * Delete a comment, checking user permission.
 */
export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.user !== userId) throw new Error("Permission denied");
    await ctx.db.delete(args.commentId);
    return null;
  },
});

export const newComment = mutation({
  args: {
    song: v.number(),
    start: v.number(),
    end: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");
    return await ctx.db.insert("comments", {
      ...args,
      user: userId,
      color: colors[Math.floor(Math.random() * colors.length)], // Default color
      title: "",
      content: "",
    });
    return null;
  },
});
