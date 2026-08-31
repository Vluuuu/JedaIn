import { Link } from "react-router";
import type { MoodPresetItem } from "./types";

export interface MoodChipProps {
  mood: MoodPresetItem;
}

export function MoodChip({ mood }: MoodChipProps) {
  return (
    <Link
      to={`/explore?mood=${encodeURIComponent(mood.id)}`}
      className="home-mood-chip"
    >
      <span>🌿</span>
      <span>{mood.label}</span>
    </Link>
  );
}
