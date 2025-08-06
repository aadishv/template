import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/cvx";
import {
  Song,
  useCommentsForSong,
  useElementSelection,
  useSong,
} from "@/hooks";
import { useMutation } from "convex/react";
import { useQueryState } from "nuqs";
import { Redirect } from "wouter";
import { Id } from "convex/_generated/dataModel";
import CommentView from "@/components/comment/Comment";
import CommentHighlight from "@/components/comment/CommentHighlight";
import { createAtom } from "@xstate/store";
import { useAtom } from "@xstate/store/react";

// eslint-disable-next-line react-refresh/only-export-components
export const commentsFocus = createAtom({
  focusedElement: null as Id<"comments"> | null,
  queuedEdit: null as Id<"comments"> | null,
});

function SongDetails({ song }: { song: Song }) {
  /* info card */
  return (
    <div>
      <div className="text-xl font-bold mb-1">
        {song.trackName || song.name}
      </div>
      <div className="text-sm text-muted-foreground mb-2">
        <span>
          Artist: <span className="font-medium">{song.artistName}</span>
        </span>
        <span className="mx-2">|</span>
        <span>
          Album: <span className="font-medium">{song.albumName}</span>
        </span>
      </div>
      <div className="text-xs">
        Duration:{" "}
        {typeof song.duration === "number"
          ? `${Math.floor(song.duration / 60).toFixed(0)}:${(song.duration % 60).toFixed(0).padStart(2, "0")}`
          : "?"}{" "}
        min
        <span className="mx-2">|</span>
        {song.instrumental ? "instrumental" : "with lyrics ↓"}
        {song.isSaved ? (
          <Badge className="ml-2" variant="default">
            Saved
          </Badge>
        ) : (
          <Badge className="ml-2" variant="outline">
            Not saved
          </Badge>
        )}
      </div>
    </div>
  );
}

function SongPageInternal({ id }: { id: number }) {
  const { isLoading, data } = useSong(id);
  const saveSong = useMutation(api.library.saveSong);

  const { data: comments } = useCommentsForSong(id);
  const updateComment = useMutation(api.comments.updateComment);
  const deleteComment = useMutation(api.comments.deleteComment);
  const newComment = useMutation(api.comments.newComment);

  const selection = useElementSelection({
    id: "song-lyrics",
  });

  const focusedComment = useAtom(commentsFocus, (c) => c.focusedElement);
  return (
    <div className="flex flex-col min-h-screen mx-auto w-full pb-8">
      {isLoading ? (
        <Skeleton className="h-40 w-full top-15" />
      ) : data ? (
        <div className="flex flex-col">
          {/* card */}
          <div className="sticky top-15 h-32 z-10 flex flex-row rounded-lg border p-4 shadow bg-white">
            <SongDetails song={data} />
            {/* button group */}
            <div className="ml-auto h-full">
              {data.isSaved ? (
                <div className="flex flex-col">
                  <div className="mb-auto">
                    <Button
                      disabled={selection == null}
                      onClick={() => {
                        window.getSelection()?.removeAllRanges();
                        void (async () => {
                          const id = await newComment({
                            song: data.id,
                            start: selection?.startOffset || 0,
                            end: selection?.endOffset || 0,
                          });
                          commentsFocus.set((c) => ({
                            ...c,
                            queuedEdit: id,
                          }));
                        })();
                      }}
                      title={
                        selection == null
                          ? "Select lyrics to begin commenting"
                          : ""
                      }
                    >
                      Add comment to selection
                    </Button>
                  </div>
                  <span className="my-auto text-xs">&nbsp;</span>
                  <Button
                    variant="destructive"
                    className="ml-auto"
                    onClick={() => {
                      if (data.id) {
                        void saveSong({ id: data.id });
                      }
                    }}
                  >
                    Unsave
                  </Button>
                </div>
              ) : (
                <Button
                  variant="fancy"
                  onClick={() => {
                    if (data.id) {
                      void saveSong({ id: data.id });
                    }
                  }}
                >
                  Save song
                </Button>
              )}
            </div>
          </div>
          <div className="flex">
            <div className="flex w-[66%] flex-col flex-1 min-h-0 m-4">
              <div className="text-sm whitespace-pre-wrap overflow-y-hidden font-mono min-h-0 grid grid-cols-1 grid-rows-1">
                {comments && data?.isSaved && (
                  <CommentHighlight
                    comments={comments}
                    song={data}
                    focused={focusedComment}
                  />
                )}
                <div
                  id="song-lyrics"
                  className="overflow-y-clip"
                  style={{
                    letterSpacing: 0,
                    fontSize: "1em",
                    gridArea: "1/1",
                    zIndex: 1,
                  }}
                >
                  {data.plainLyrics || "No lyrics found."}
                </div>
              </div>
            </div>
            <div className="w-[33%] h-full relative flex flex-col gap-4 my-5">
              {comments &&
                comments.map((comment) => (
                  <CommentView
                    key={comment._id}
                    comment={comment}
                    setComment={(c) =>
                      void updateComment({
                        ...c,
                        commentId: comment._id,
                      })
                    }
                    deleteComment={() =>
                      void deleteComment({ commentId: comment._id })
                    }
                  />
                ))}
            </div>
          </div>
        </div>
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
