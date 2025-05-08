export interface Behavior {
  id?: string;
  text: string;
  date: string;
  tags: string[];
}

export interface SearchResult {
  behaviors: Behavior[];
  totalResults?: number;
} 