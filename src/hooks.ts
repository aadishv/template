import { useQuery as useTSQuery } from "@tanstack/react-query";
import api from "@/cvx";
import { useQuery } from "convex/react";

export type Song = {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics: string;
} & {
  isSaved?: boolean;
};

export const useTrackSearch = (query: {
  q: string,
  scope: "all" | "song" | "artist" | "album"
}): {
  isLoading: boolean,
  data: Song[]
} => {
  const { q, scope } = query;

  const searchParams = {
    q: scope === "all" ? q : null,
    track_name: scope === "song" ? q : null,
    artist_name: scope === "artist" ? q : null,
    album_name: scope === "album" ? q : null,
  };
  const library = useQuery(api.library.getLibrary, {});
  const params = new URLSearchParams(searchParams as Record<string, string>);
  const { isLoading, data } = useTSQuery({
    queryKey: ["trackSearch", query],
    queryFn: async () => {
      const response = await fetch(
        `https://lrclib.net/api/search?${params.toString()}`,
      );
      const data = await response.json();
      return data as Song[];
    },
    enabled: Boolean(q),
  });
  if (!q) {
    return {
      isLoading: false,
      data: []
    }
  }
  if (isLoading || data == undefined || library == undefined) {
    return {
      isLoading: true,
      data: [],
    };
  }
  return {
    isLoading,
    data: data.map(song => ({
      ...song,
      isSaved: library.includes(song.id)
    }))
  }
};

export const useLibrary = (): {
  isLoading: boolean,
  data: Song[]
} => {
  console.log("called");

  const library = useQuery(api.library.getLibrary, {});

  const getPromiseForId = (id: number) => {
    return fetch(`https://lrclib.net/api/get/${id}`).then(
      res => res.json()
    ).then(
      j => ({
        ...j,
        isSaved: true
      } as Song)
    );
  }

  const { isLoading, data } = useTSQuery({
    queryKey: ["userLibrary"],
    queryFn: async () => {
      const data = await Promise.all(library!.map(getPromiseForId));
      return data as Song[];
    },
    enabled: library != undefined,
  });
  console.log(isLoading, data);
  if (data == undefined || library == undefined) {
    return {
      isLoading: true,
      data: []
    };
  }
  return {
    isLoading,
    data
  }
};

export const useSong = (id: number): { isLoading: boolean, data?: Song } => {
  const library = useQuery(api.library.getLibrary, {});
  const { isLoading, data } = useTSQuery({
    queryKey: ["song", id],
    queryFn: async () => {
      const response = await fetch(`https://lrclib.net/api/get/${id}`);
      if (!response.ok) {
        throw new Error(`Error fetching song: ${response.statusText}`);
      }
      const song = await response.json();
      return {
        ...song,
      } as Song;
    },
    enabled: id != null && library !== undefined,
  });
  return {
    isLoading: isLoading || library === undefined,
    data: data && {
      ...data,
      isSaved: library?.includes(id) || false,
    },
  };
};
