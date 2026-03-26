export type Video = {
  id: string;
  title: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  publishedAt: string; // ISO
  viewsPerDay: number;
  daysSinceUpload: number;
};

export type AnalyzeResponse = {
  channelName: string;
  channelId: string;
  generatedAt: string;
  trending: Video[];
  videos: Video[];
};

