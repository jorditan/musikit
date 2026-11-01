import { Music2, Disc3, UserRound, UsersRound } from "lucide-react";
import type { SearchResult } from "../../../shared/search";

export function nodeCategory(result: SearchResult) {
  return result.entity === "artist"
    ? result.kind === "Group"
      ? "band"
      : "artist"
    : result.entity === "release-group"
      ? "album"
      : "song";
}
export const nodeIcons = {
  artist: UserRound,
  band: UsersRound,
  album: Disc3,
  song: Music2,
};
