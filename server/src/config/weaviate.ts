import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.WEAVIATE_URL || !process.env.WEAVIATE_API_KEY || !process.env.OPENAI_APIKEY) {
  throw new Error('Required configuration missing in environment variables (WEAVIATE_URL, WEAVIATE_API_KEY, OPENAI_APIKEY)');
}

export const client: WeaviateClient = weaviate.client({
  scheme: 'https',
  host: process.env.WEAVIATE_URL,
  apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY),
  headers: {
    'X-OpenAI-Api-Key': process.env.OPENAI_APIKEY
  }
});

// Schema definitions
export const MEMORY_CLASS_NAME = 'Memory';
export const BEHAVIOR_CLASS_NAME = 'Behavior';

export async function initializeSchema() {
  try {
    // Check if schemas exist
    const schema = await client.schema.getter().do();
    const memoryClassExists = schema.classes?.some(c => c.class === MEMORY_CLASS_NAME);
    const behaviorClassExists = schema.classes?.some(c => c.class === BEHAVIOR_CLASS_NAME);

    // Create Memory schema if it doesn't exist
    if (!memoryClassExists) {
      await client.schema
        .classCreator()
        .withClass({
          class: MEMORY_CLASS_NAME,
          description: 'A class to store memory entries',
          vectorizer: 'text2vec-openai',
          properties: [
            {
              name: 'title',
              dataType: ['text'],
              description: 'The title of the memory',
            },
            {
              name: 'text',
              dataType: ['text'],
              description: 'The content of the memory',
            },
            {
              name: 'date',
              dataType: ['date'],
              description: 'When this memory was created',
            },
            {
              name: 'tags',
              dataType: ['text[]'],
              description: 'Tags associated with the memory',
            }
          ],
        })
        .do();
      console.log('Memory schema created successfully');
    }

    // Create Behavior schema if it doesn't exist
    if (!behaviorClassExists) {
      await client.schema
        .classCreator()
        .withClass({
          class: BEHAVIOR_CLASS_NAME,
          description: 'A class to store behavior entries',
          vectorizer: 'text2vec-openai',
          properties: [
            {
              name: 'text',
              dataType: ['text'],
              description: 'The content of the behavior',
            },
            {
              name: 'date',
              dataType: ['date'],
              description: 'When this behavior was recorded',
            },
            {
              name: 'tags',
              dataType: ['text[]'],
              description: 'Tags associated with the behavior',
            }
          ],
        })
        .do();
      console.log('Behavior schema created successfully');
    }
  } catch (error) {
    console.error('Error initializing schema:', error);
    throw error;
  }
} 