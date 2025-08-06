import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/cvx";
import {
  Song,
  useCommentsForSong,
  useElementSelection,
  useLibrary,
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
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// eslint-disable-next-line react-refresh/only-export-components
export const commentsFocus = createAtom({
  focusedElement: null as Id<"comments"> | null,
  queuedEdit: null as Id<"comments"> | null,
});

function SongDetails({ song }: { song: Song }) {
  /* info card */
  return (
    <div className="p-4">
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

function SongChooser({ realSong }: {realSong: Song}) {
  const { isLoading, data: library } = useLibrary();
  const link = useMutation(api.comments.linkCommentToSong);
  const SongComments = ({ song }: { song: Song }) => {
    const { isLoading: songIsLoading, data: comments } = useCommentsForSong(song.id);
    return (
      <>
        <div className="flex flex-col">
          {songIsLoading ? (
            <Skeleton className="w-full h-10" />
          ) : comments ? (
            comments.map((comment) => {
              return (
                <div
                  key={comment._id}
                  className="text-sm p-3 w-full h-full border flex flex-col rounded-xl border-black/20"
                >
                  <blockquote
                    style={{
                      borderLeft: "4px solid #ccc",
                      padding: "0.5em 1em",
                      background: "#f9f9f9",
                      fontStyle: "italic",
                    }}
                  >
                    {song.plainLyrics.slice(comment.start, comment.end)}
                  </blockquote>
                  <span>
                  <span className="font-semibold">
                    {comment.title || "No title"}
                  </span>
                  <span className="text-muted-foreground">
                    : {comment.content}
                  </span>
                  </span>
                  <DialogClose asChild>
                    <Button className="ml-auto" onClick={() =>
                      void link({
                        commentId: comment._id,
                        songId: realSong.id
                      })
                    }>Link this comment</Button>
                  </DialogClose>
                </div>
              );
            })
          ) : (
            "No comments"
          )}
        </div>
      </>
    );
  };
  const songAccordion = (song: Song) => (
    <AccordionItem value={`${song.id}`}>
      <AccordionTrigger>
        <span>
          <b className="">{`${song.name}`}</b>
          {` | ${song.albumName} | ${song.artistName}`}
        </span>
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-4 text-balance">
        <SongComments song={song} />
      </AccordionContent>
    </AccordionItem>
  );
  return (
    <div className="grid gap-4">
      <Accordion
        type="single"
        collapsible
        className="w-full"
        defaultValue="item-1"
      >
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : library ? (
          library.map((song) => songAccordion(song))
        ) : (
          "No songs in your library."
        )}
      </Accordion>
    </div>
  );
}

function SongPageInternal({ id }: { id: number }) {
  const { isLoading, data } = useSong(id);
  const saveSong = useMutation(api.library.saveSong);

  const { data: comments } = useCommentsForSong(id);
  const updateComment = useMutation(api.comments.updateComment);
  const deleteComment = useMutation(api.comments.deleteComment);
  const unlink = useMutation(api.comments.unlinkCommentFromSong);
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
          <div className="sticky top-15 h-32 z-10 flex flex-row rounded-lg border shadow bg-white">
            <SongDetails song={data} />
            {/* button group */}
            <div className="ml-auto h-full my-1 mr-1">
              {data.isSaved ? (
                <div className="flex flex-col">
                  <div className="gap-1 mb-1 flex flex-col">
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          disabled={selection == null}
                          title={
                            selection == null
                              ? "Select lyrics to begin commenting"
                              : ""
                          }
                        >
                          Link comment to selection
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Choose comment to link</DialogTitle>
                        </DialogHeader>
                        <SongChooser realSong={data} />
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="destructive">Cancel</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
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
                    deleteComment={() => {
                      if (!comment.linked) {
                        void deleteComment({ commentId: comment._id })
                      } else {
                        void unlink({
                          commentId: comment._id,
                          songId: data.id,
                        })
                      }
                    }}
                    songId={data.id}
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
