// import { useLibrary } from "@/hooks";
// import SongTable from "@/components/Songtable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSong } from "@/hooks";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Redirect } from "wouter";

function SongPageInternal({ id }: { id: number }) {
  // we disable because of the hook order warning, even though it will *always*
  // render two or otherwise immediately redirect
  const { isLoading, data } = useSong(id);

  const [selection, setSelection] = useState<Range | null>(null);
  useEffect(() => {
    const abortController = new AbortController();
    const handler = () => {
      const range = document.getSelection()?.getRangeAt(0);
      const start = range?.startContainer.parentElement;
      const end = range?.endContainer.parentElement;
      if (
        start == end &&
        start?.id == "song-lyrics" &&
        range &&
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
  }, [selection]);
  // useEffect(() => {
  //   if (selection) {
  //     console.log(
  //       data?.plainLyrics.slice(selection?.startOffset, selection?.endOffset),
  //     );
  //   }
  // }, [data, selection]);
  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto pb-8">
      {isLoading ? (
        <Skeleton className="h-40 w-full top-15" />
      ) : data ? (
        <>
          <div className="sticky top-15 z-10 flex flex-row rounded-lg border p-4 shadow bg-white">
            {/* info card */}
            <div>
              <div className="text-xl font-bold mb-1">
                {data.trackName || data.name}
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                <span>
                  Artist: <span className="font-medium">{data.artistName}</span>
                </span>
                <span className="mx-2">|</span>
                <span>
                  Album: <span className="font-medium">{data.albumName}</span>
                </span>
              </div>
              <div className="text-xs">
                Duration:{" "}
                {typeof data.duration === "number"
                  ? `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, "0")}`
                  : "?"}{" "}
                min
                <span className="mx-2">|</span>
                {data.instrumental ? "instrumental" : "with lyrics ↓"}
                {data.isSaved && (
                  <Badge className="ml-2" variant="default">
                    Saved
                  </Badge>
                )}
              </div>
            </div>
            {selection ? (
              <Button className="ml-auto">Add comment to selection</Button>
            ) : (
              <span className="ml-auto text-black/50">
                {"Select some text to begin commenting"}
              </span>
            )}
          </div>
          <div className="flex flex-col flex-1 min-h-0">
            <div className="text-sm whitespace-pre-wrap overflow-y-auto font-mono min-h-0 grid grid-cols-1 grid-rows-1">
              {selection && (
                <div aria-disabled className="z-0" style={{ gridArea: "1/1" }}>
                  {[...data.plainLyrics].map((char, i) =>
                    char == "\n" ? (
                      char
                    ) : (
                      <span
                        key={i}
                        style={{
                          display: "inline-block",
                          width: "1ch",
                          height: "1.1em",
                          backgroundColor:
                            i >= selection.startOffset &&
                            i < selection.endOffset
                              ? "red"
                              : "transparent",
                          verticalAlign: "middle",
                        }}
                      ></span>
                    ),
                  )}
                </div>
              )}
              <div
                id="song-lyrics"
                style={{
                  letterSpacing: 0,
                  fontSize: "1em",
                  zIndex: 1,
                  gridArea: "1/1",
                }}
              >
                {data.plainLyrics || "No lyrics found."}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-destructive">Song not found.</div>
      )}
    </div>
  );
}

export default function SongPage() {
  const [id] = useQueryState<number | null>("id", {
    defaultValue: null,
    parse: (v) => parseInt(v),
  });
  if (!id) {
    return <Redirect to="/404" />;
  }
  return <SongPageInternal id={id} />;
}
