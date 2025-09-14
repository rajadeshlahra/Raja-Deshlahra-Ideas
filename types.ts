export interface FeedLog {
  id: number;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  feedType: 'breast' | 'formula';
  burp?: boolean;
  vomit?: boolean;
}
