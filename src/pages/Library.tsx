import { useLibrary } from "@/hooks";
import SongTable from "@/components/Songtable";
import { LibraryBig } from "lucide-react";
export default function LibraryPage() {
  const { data, isLoading } = useLibrary();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row font-serif"><LibraryBig /><h1>Library</h1></div>
      <SongTable isLoading={isLoading} data={data} />
    </div>
  );
}
