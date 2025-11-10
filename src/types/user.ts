export interface User {
  id: string;
  displayName: string;
  email: string | null;
  photo: string | null;
}

export interface WatchedMovie {
  movieId: string;
  rating: number;
  watchedAt: Date;
}
