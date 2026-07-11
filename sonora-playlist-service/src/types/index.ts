export interface PlaylistItemDTO {
  id: string;
  playlistId: string;
  audioJobId: string;
  position: number;
  title?: string | null;
}

export interface PlaylistDTO {
  id: string;
  userId: string;
  name: string;
  items: PlaylistItemDTO[];
}
