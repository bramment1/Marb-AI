export interface RPCRequest {
  method: string;
  params?: unknown;
}

export interface RPCResponse<T = unknown> {
  result?: T;
  error?: { code: number; message: string };
}

export type TextDiff = { path: string; kind: 'text'; diff: string };
export type BinaryChange = {
  path: string;
  kind: 'binary';
  status: 'added' | 'modified' | 'deleted';
  sizeBefore?: number;
  sizeAfter?: number;
};
export type PreviewItem = TextDiff | BinaryChange;
