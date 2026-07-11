import type { PlaylistItem as PlaylistItemType } from '../types';

interface PlaylistItemProps {
  item: PlaylistItemType;
}

export function PlaylistItem({ item }: PlaylistItemProps) {
  return (
    <article className="card">
      <strong>{item.title}</strong>
      <p className="muted">Position {item.position}</p>
    </article>
  );
}
