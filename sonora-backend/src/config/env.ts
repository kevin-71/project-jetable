export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'change-me',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  playlistServiceUrl: process.env.PLAYLIST_SERVICE_URL ?? 'http://playlist-service:4001',
  audioServiceHost: process.env.AUDIO_SERVICE_HOST ?? 'localhost',
  audioServicePort: Number(process.env.AUDIO_SERVICE_PORT ?? 50051),
};
