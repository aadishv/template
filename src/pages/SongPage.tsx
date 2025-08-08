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
import { Redirect } from "wouter";
import CommentView from "@/components/comment/CommentView";
import CommentHighlight from "@/components/comment/CommentHighlight";
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
import { CommentChooser } from "@/components/comment/CommentChooser";
import {
  commentsFocus,
  selectionAtom,
  useCurrentSong,
} from "@/components/comment/state";
import Confirm from "@/components/Confirm";

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

function SongPageInternal({ id }: { id: number }) {
  const { isLoading, data } = useSong(id);
  const saveSong = useMutation(api.library.saveSong);

  const { data: comments } = useCommentsForSong(id);
  const updateComment = useMutation(api.comments.updateComment);
  const deleteComment = useMutation(api.comments.deleteComment);
  const unlink = useMutation(api.comments.unlinkCommentFromSong);
  const newComment = useMutation(api.comments.newComment);

  useElementSelection({
    id: "song-lyrics",
    setter: (v) => {
      selectionAtom.set((old) => {
        if (v == null) {
          return { ...old, selection: v };
        } else {
          return { lastSelection: v, selection: v };
        }
      });
    },
  });

  const focusedComment = useAtom(commentsFocus, (c) => c.focusedElement);
  const selection = useAtom(selectionAtom, (c) => c.selection);

  const handleNewComment = () => {
    window.getSelection()?.removeAllRanges();
    void (async () => {
      const id = await newComment({
        song: data!.id,
        start: selection?.startOffset || 0,
        end: selection?.endOffset || 0,
      });
      commentsFocus.set((c) => ({
        ...c,
        queuedEdit: id,
      }));
    })();
  };

  return (
    <div className="fixed inset-0 flex flex-col w-full overflow-hidden pt-16 px-16">
      {isLoading ? (
        <Skeleton className="h-40 w-full top-15" />
      ) : data ? (
        <div className="flex flex-col">
          {/* card */}
          <div className="flex-shrink-0 h-32 z-10 flex flex-row rounded-lg border shadow bg-white relative">
            <SongDetails song={data} />
            {/* button group */}
            <div className="ml-auto h-full my-1 mr-1">
              {data.isSaved ? (
                <div className="flex flex-col">
                  <div className="gap-1 mb-1 flex flex-col">
                    <Button
                      disabled={selection == null}
                      onClick={handleNewComment}
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
                        <CommentChooser />
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="destructive">Cancel</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Confirm
                    message="Removing this song from your library will permanently delete any comments on it."
                    action="Unsave this song"
                    onConfirm={() => {
                      if (data.id) {
                        void saveSong({ id: data.id });
                      }
                    }}
                  >
                    <Button variant="destructive" className="ml-auto">
                      Unsave
                    </Button>
                  </Confirm>
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
          <div
            className="flex relative"
            style={{ height: "calc(100vh - 192px)" }}
          >
            {/* lyrics */}
            <div className="w-[66%] relative">
              <div className="absolute inset-4 overflow-y-auto">
                <div className="text-sm whitespace-pre-wrap font-mono grid grid-cols-1 grid-rows-1">
                  {comments && data?.isSaved && (
                    <CommentHighlight
                      comments={comments}
                      song={data}
                      focused={focusedComment}
                    />
                  )}
                  <div
                    id="song-lyrics"
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
            </div>
            {/* comments */}
            <div className="w-[33%] relative">
              <div className="absolute inset-0 overflow-y-auto flex flex-col gap-4 p-4">
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
                          void deleteComment({ commentId: comment._id });
                        } else {
                          void unlink({
                            commentId: comment._id,
                            songId: data.id,
                          });
                        }
                      }}
                    />
                  ))}
              </div>
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
  const [id] = useCurrentSong();
  if (!id) {
    return <Redirect to="/404" />;
  }
  return <SongPageInternal id={id} />;
}
