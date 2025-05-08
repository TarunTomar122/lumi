import { client, BEHAVIOR_CLASS_NAME } from '../config/weaviate';
import { Behavior, SearchResult } from '../types/behavior';

export class BehaviorService {
  async createBehavior(behavior: Behavior): Promise<string> {
    try {
      const result = await client.data
        .creator()
        .withClassName(BEHAVIOR_CLASS_NAME)
        .withProperties({
          text: behavior.text,
          date: behavior.date,
          tags: behavior.tags,
        })
        .do();

      if (!result.id) {
        throw new Error('Failed to create behavior: no ID returned');
      }

      return result.id;
    } catch (error) {
      console.error('Error creating behavior:', error);
      throw error;
    }
  }

  async getBehavior(id: string): Promise<Behavior | null> {
    try {
      const result = await client.data
        .getterById()
        .withClassName(BEHAVIOR_CLASS_NAME)
        .withId(id)
        .do();

      if (!result || !result.properties) return null;

      return {
        id: result.id,
        text: result.properties.text as string,
        date: result.properties.date as string,
        tags: result.properties.tags as string[],
      };
    } catch (error) {
      console.error('Error getting behavior:', error);
      throw error;
    }
  }

  async searchBehaviors(searchText: string): Promise<SearchResult> {
    try {
      const result = await client.graphql
        .get()
        .withClassName(BEHAVIOR_CLASS_NAME)
        .withFields('text date tags _additional { id }')
        .withNearText({ concepts: [searchText] })
        .withLimit(10)
        .do();

      const behaviors = result.data.Get[BEHAVIOR_CLASS_NAME].map((item: any) => ({
        id: item._additional?.id,
        text: item.text,
        date: item.date,
        tags: item.tags,
      }));

      return {
        behaviors,
        totalResults: behaviors.length,
      };
    } catch (error) {
      console.error('Error searching behaviors:', error);
      throw error;
    }
  }

  async deleteBehavior(id: string): Promise<void> {
    try {
      await client.data
        .deleter()
        .withClassName(BEHAVIOR_CLASS_NAME)
        .withId(id)
        .do();
    } catch (error) {
      console.error('Error deleting behavior:', error);
      throw error;
    }
  }

  async getAllBehaviors(): Promise<Behavior[]> {
    try {
      const result = await client.graphql
        .get()
        .withClassName(BEHAVIOR_CLASS_NAME)
        .withFields('text date tags _additional { id }')
        .withLimit(100) // Limiting to 100 behaviors for performance
        .do();

      const behaviors = result.data.Get[BEHAVIOR_CLASS_NAME].map((item: any) => ({
        id: item._additional?.id,
        text: item.text,
        date: item.date,
        tags: item.tags,
      }));

      return behaviors;
    } catch (error) {
      console.error('Error getting all behaviors:', error);
      throw error;
    }
  }
} 