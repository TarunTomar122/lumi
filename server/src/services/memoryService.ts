import { client, MEMORY_CLASS_NAME } from '../config/weaviate';
import { Memory, SearchResult } from '../types/memory';

export class MemoryService {
  async createMemory(memory: Memory): Promise<string> {
    try {
      const result = await client.data
        .creator()
        .withClassName(MEMORY_CLASS_NAME)
        .withProperties({
          title: memory.title,
          text: memory.text,
          date: memory.date,
          tags: memory.tags,
        })
        .do();

      if (!result.id) {
        throw new Error('Failed to create memory: no ID returned');
      }

      return result.id;
    } catch (error) {
      console.error('Error creating memory:', error);
      throw error;
    }
  }

  async updateMemory(id: string, memory: Memory): Promise<void> {
    try {
      await client.data
        .updater()
        .withClassName(MEMORY_CLASS_NAME)
        .withId(id)
        .withProperties({
          title: memory.title,
          text: memory.text,
          date: memory.date,
          tags: memory.tags,
        })
        .do();
    } catch (error) {
      console.error('Error updating memory:', error);
      throw error;
    }
  }

  async getMemory(id: string): Promise<Memory | null> {
    try {
      const result = await client.data
        .getterById()
        .withClassName(MEMORY_CLASS_NAME)
        .withId(id)
        .do();

      if (!result || !result.properties) return null;

      return {
        id: result.id,
        title: result.properties.title as string,
        text: result.properties.text as string,
        date: result.properties.date as string,
        tags: result.properties.tags as string[],
      };
    } catch (error) {
      console.error('Error getting memory:', error);
      throw error;
    }
  }

  async searchMemories(searchText: string): Promise<SearchResult> {
    try {
      const result = await client.graphql
        .get()
        .withClassName(MEMORY_CLASS_NAME)
        .withFields('title text date tags _additional { id }')
        .withNearText({ concepts: [searchText] })
        .withLimit(10)
        .do();

      const memories = result.data.Get[MEMORY_CLASS_NAME].map((item: any) => ({
        id: item._additional?.id,
        title: item.title,
        text: item.text,
        date: item.date,
        tags: item.tags,
      }));

      return {
        memories,
        totalResults: memories.length,
      };
    } catch (error) {
      console.error('Error searching memories:', error);
      throw error;
    }
  }

  async deleteMemory(id: string): Promise<void> {
    try {
      await client.data.deleter().withClassName(MEMORY_CLASS_NAME).withId(id).do();
    } catch (error) {
      console.error('Error deleting memory:', error);
      throw error;
    }
  }

  async getAllMemories(): Promise<Memory[]> {
    try {
      const result = await client.graphql
        .get()
        .withClassName(MEMORY_CLASS_NAME)
        .withFields('title text date tags _additional { id }')
        .withLimit(100) // Limiting to 100 memories for performance
        .do();

      const memories = result.data.Get[MEMORY_CLASS_NAME].map((item: any) => ({
        id: item._additional?.id,
        title: item.title,
        text: item.text,
        date: item.date,
        tags: item.tags,
      }));

      return memories;
    } catch (error) {
      console.error('Error getting all memories:', error);
      throw error;
    }
  }
}
