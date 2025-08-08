import { createAtom } from "@xstate/store";
import { Id } from "convex/_generated/dataModel";
import { useQueryState } from "nuqs";

export const selectionAtom = createAtom({
  selection: null as Range | null,
  lastSelection: null as Range | null,
});

export const commentsFocus = createAtom({
  focusedElement: null as Id<"comments"> | null,
  queuedEdit: null as Id<"comments"> | null,
});

export function useCurrentSong() {
  return useQueryState<number | null>("id", {
    defaultValue: null,
    parse: (v) => parseInt(v),
  });
}
