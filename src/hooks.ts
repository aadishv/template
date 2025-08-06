import { useQuery as useTSQuery } from "@tanstack/react-query";
import api from "@/cvx";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Id } from "convex/_generated/dataModel";

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

export type Comment = {
  user: string;
  content: string;
  start: number;
  end: number;
  color: string;
  title: string;
  _id: Id<"comments">;
  linked: number | null;
};

export const useTrackSearch = (query: {
  q: string;
  scope: "all" | "song" | "artist" | "album";
}): {
  isLoading: boolean;
  data: Song[];
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
      data: [],
    };
  }
  if (isLoading || data == undefined || library == undefined) {
    return {
      isLoading: true,
      data: [],
    };
  }
  return {
    isLoading,
    data: data.map((song) => ({
      ...song,
      isSaved: library.includes(song.id),
    })),
  };
};

export const useLibrary = (): {
  isLoading: boolean;
  data: Song[];
} => {

  const library = useQuery(api.library.getLibrary, {});

  const getPromiseForId = async (id: number) => await fetch(`https://lrclib.net/api/get/${id}`)
      .then((res) => res.json())
      .then(
        (j) =>
          ({
            ...j,
            isSaved: true,
          }) as Song,
      );

  const { isLoading, data } = useTSQuery({
    queryKey: ["userLibrary", library],
    queryFn: async () => {
      const data = await Promise.all(library!.map(getPromiseForId));
      return data as Song[];
    },
    enabled: library != undefined,
  });
  if (data == undefined || library == undefined) {
    return {
      isLoading: true,
      data: [],
    };
  }
  return {
    isLoading,
    data,
  };
};

export const useSong = (id: number): { isLoading: boolean; data?: Song } => {
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

export const useCommentsForSong = (
  songId: number,
): {
  isLoading: boolean;
  data: Comment[];
} => {
  const comments = useQuery(api.comments.getUserCommentsForSong, { songId });
  return {
    isLoading: comments === undefined,
    data: comments || [],
  };
};

export const useElementSelection = ({ id }: { id: string }) => {
  const [selection, setSelection] = useState<Range | null>(null);
  useEffect(() => {
    const abortController = new AbortController();
    const handler = () => {
      const docSelection = document.getSelection();
      if (docSelection?.rangeCount == 0 || !docSelection) {
        setSelection(null);
        return;
      }
      const range = docSelection.getRangeAt(0);
      const start = range.startContainer.parentElement;
      const end = range.endContainer.parentElement;
      if (
        start == end &&
        start?.id == id &&
        range.startOffset < range.endOffset &&
        range != selection
      ) {
        setSelection(range ?? null);
      } else {
        setSelection(null);
      }
    };

    document.addEventListener("selectionchange", handler, {
      signal: abortController.signal,
    });

    return () => {
      abortController.abort();
    };
  }, [selection, id]);
  return selection;
};
