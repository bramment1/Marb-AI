export interface ProjectSummary {
  root: string;
  files: string[];
}

export interface ImprovedPrompt {
  improved: string;
  score: number;
  checklist: string[];
}

export type TextDiff = { path: string; kind: "text"; diff: string };
export type BinaryChange = {
  path: string;
  kind: "binary";
  status: "added" | "modified" | "deleted";
  sizeBefore?: number;
  sizeAfter?: number;
};
export type PreviewItem = TextDiff | BinaryChange;
