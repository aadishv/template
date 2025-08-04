// import { useLibrary } from "@/hooks";
// import SongTable from "@/components/Songtable";
import { Skeleton } from "@/components/ui/skeleton";
import { useSong } from "@/hooks";
import { LibraryBig } from "lucide-react";
import { useQueryState } from "nuqs";
import { Redirect } from "wouter";
export default function SongPage() {
  const [id] = useQueryState<number | null>("id", { defaultValue: null, parse: v => parseInt(v) });
  console.log(id, "TEST");
  if (!id) {
    return <Redirect to="/404" />;
  }
  // we disable because of the hook order warning, even though it will *always*
  // render two or otherwise immediately redirect
  /* eslint-disable */
  const { isLoading, data } = useSong(id);
  /* eslint-enable */
  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto pb-8">
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : data ? (
        <>
          <div className="sticky top-15 z-10 flex flex-col rounded-lg border p-4 shadow mb-6 bg-white">
            <div className="text-xl font-bold mb-1">{data.trackName || data.name}</div>
            <div className="text-sm text-muted-foreground mb-2">
              <span>Artist: <span className="font-medium">{data.artistName}</span></span>
              <span className="mx-2">|</span>
              <span>Album: <span className="font-medium">{data.albumName}</span></span>
            </div>
            <div className="text-xs text-muted-foreground mb-0">
              Duration: {typeof data.duration === "number" ? `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, "0")}` : "?"} min
              <span className="mx-2">|</span>
              {data.instrumental ? "Instrumental" : "With Lyrics"}
              {data.isSaved && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">Saved</span>}
            </div>
          </div>
          <div className="flex flex-col flex-1 min-h-0">
            <div className="font-semibold mb-2">Lyrics</div>
            <div
              className="flex-1 overflow-y-auto rounded bg-muted/80 p-4 text-sm whitespace-pre-wrap min-h-0"
            >
              {data.plainLyrics || "No lyrics found."}
            </div>
          </div>
        </>
      ) : (
        <div className="text-destructive">Song not found.</div>
      )}
    </div>
  );
}
