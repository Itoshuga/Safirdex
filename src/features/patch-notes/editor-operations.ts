export function movePatchNoteBlock<T>(blocks: readonly T[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= blocks.length || to >= blocks.length) return [...blocks];
  const next = [...blocks];
  const [block] = next.splice(from, 1);
  if (block !== undefined) next.splice(to, 0, block);
  return next;
}

export function deletePatchNoteBlock<T>(blocks: readonly T[], index: number) {
  return blocks.filter((_, blockIndex) => blockIndex !== index);
}

export function insertPatchNoteBlockCopy<T>(blocks: readonly T[], index: number, copy: T) {
  const next = [...blocks];
  next.splice(Math.min(Math.max(index + 1, 0), next.length), 0, copy);
  return next;
}
