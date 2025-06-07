export interface Memory {
  id?: string;
  title: string;
  text: string;
  date: string;
  tags: string[];
}

export interface SearchResult {
  memories: Memory[];
  totalResults?: number;
} 