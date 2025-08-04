import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Song } from "@/hooks";
import { Bookmark, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import api from "../cvx";
type SongTable = {
  isLoading: boolean;
  data: (Song & { isSaved?: boolean })[] | undefined;
};
export default function SongTable({ isLoading, data }: SongTable) {
  const saveSong = useMutation(api.library.saveSong);

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">Track Name</TableHead>
            <TableHead className="w-1/4">Artist</TableHead>
            <TableHead className="w-1/4">Album</TableHead>
            <TableHead className="w-[12%]">Duration</TableHead>
            <TableHead className="w-[5%]">&nbsp;</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                </TableRow>
              ))
            : data && data.length > 0
              ? data.map((song) => (
                  <TableRow key={song.id}>
                    <TableCell className="font-medium">
                      {song.trackName}
                    </TableCell>
                    <TableCell>{song.artistName}</TableCell>
                    <TableCell>{song.albumName}</TableCell>
                    <TableCell>
                      {song.duration
                        ? `${Math.floor(song.duration / 60)}:${(
                            song.duration % 60
                          )
                            .toFixed(0)
                            .toString()
                            .padStart(2, "0")}`
                        : "--"}
                    </TableCell>
                    {song.isSaved != undefined && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          className="-py-2 -my-2"
                          onClick={() => void saveSong({ id: song.id })}
                          aria-label={
                            song.isSaved
                              ? "Remove song from library"
                              : "Save song to library"
                          }
                          title={
                            song.isSaved
                              ? "Remove song from library"
                              : "Save song to library"
                          }
                        >
                          <Bookmark
                            className=""
                            fill={song.isSaved ? "#000" : "none"}
                            stroke="#000"
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          className="-py-2 -my-2"
                          aria-label={"Open song lyrics"}
                          title={"Open song lyrics"}
                        >
                          <a href={`/song?id=${song.id}`}><ListMusic /></a>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              : !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      No results found. Try a different search query.
                    </TableCell>
                  </TableRow>
                )}
        </TableBody>
      </Table>
    </div>
  );
}
