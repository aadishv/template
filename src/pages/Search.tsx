import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useTrackSearch } from "@/hooks";
import { useQueryState } from "nuqs";
import SongTable from "@/components/SongTable";
export default function SearchPage() {
  const [query, setQuery] = useQueryState<string>("query", {
    defaultValue: "",
    parse: (v) => v,
  });
  const [scope, setScope] = useState<"all" | "song" | "artist" | "album">(
    "all",
  );
  const { data, isLoading } = useTrackSearch({
    q: query,
    scope,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-4">
        <Input
          placeholder="Search for a song, artist, or album..."
          value={query}
          onChange={(e) => void setQuery(e.target.value)}
          className="w-full"
        />
        <Select
          value={scope}
          onValueChange={(v) => setScope(v as typeof scope)}
        >
          <SelectTrigger className="w-30">
            <SelectValue>
              {scope === "all"
                ? "All"
                : scope.charAt(0).toUpperCase() + scope.slice(1)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="song">Song</SelectItem>
            <SelectItem value="artist">Artist</SelectItem>
            <SelectItem value="album">Album</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <SongTable isLoading={isLoading} data={data} />
    </div>
  );
}
