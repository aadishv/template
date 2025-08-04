import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
// import { Song, SongConvexs } from "../src/api"
export const saveSong = mutation({
  // Validators for arguments.
  args: {
    id: v.number(),
  },

  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const exists = await ctx.runQuery(api.library.hasSavedSong, {
      songId: id,
    });
    if (exists != null) {
      await ctx.db.delete(exists);
    } else {
      await ctx.db.insert("saved", { user: userId, song: id });
    }
  },
});

export const getLibrary = query({
  args: {},
  returns: v.array(v.number()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const songs = await ctx.db
      .query("saved")
      .withIndex("user", (q) => q.eq("user", userId))
      .collect();
    const r = songs.map((song) => song.song);
    return r;
  },
});

export const hasSavedSong = query({
  args: {
    songId: v.number(),
  },
  returns: v.union(v.id("saved"), v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const saved = await ctx.db
      .query("saved")
      .withIndex("user", (q) => q.eq("user", userId))
      .filter((q) => q.eq(q.field("song"), args.songId))
      .unique();
    if (!saved) {
      return null;
    }
    return saved._id;
  },
});

export const batchedHasSavedSong = query({
  args: {
    songIds: v.array(v.number()),
  },
  returns: v.array(v.union(v.id("saved"), v.null())),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return args.songIds.map(() => null);

    // Fetch all saved songs for this user in one query
    const savedSongs = await ctx.db
      .query("saved")
      .withIndex("user", (q) => q.eq("user", userId))
      .collect();

    // Build a map from songId to saved record _id
    const songIdToSavedId = new Map<number, Id<"saved">>();
    for (const saved of savedSongs) {
      songIdToSavedId.set(saved.song, saved._id);
    }

    // Return an array of saved _id or null for each songId
    return args.songIds.map((songId) => songIdToSavedId.get(songId) ?? null);
  },
});
