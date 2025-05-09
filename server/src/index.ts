import express, { Request, Response } from 'express';
import cors from 'cors';
import { initializeSchema } from './config/weaviate';
import { MemoryService } from './services/memoryService';
import { BehaviorService } from './services/behaviorService';

const app = express();
const port = process.env.PORT || 3001;
const memoryService = new MemoryService();
const behaviorService = new BehaviorService();

app.use(cors());
app.use(express.json());

// Initialize Weaviate schema
initializeSchema().catch(console.error);

// Memory endpoints
app.get('/api/memories', async (_req: Request, res: Response) => {
  try {
    const memories = await memoryService.getAllMemories();
    res.json({ memories, totalResults: memories.length });
  } catch (error) {
    console.error('Error getting all memories:', error);
    res.status(500).json({ error: 'Failed to get memories' });
  }
});

app.post('/api/memories', async (req: Request, res: Response) => {
  try {
    const { title, text, tags } = req.body;

    if (!title || !text) {
      return res.status(400).json({ error: 'Title and text are required' });
    }

    const memory = {
      title,
      text,
      date: new Date().toISOString(),
      tags: tags || [],
    };
    const id = await memoryService.createMemory(memory);
    res.status(201).json({ id });
  } catch (error) {
    console.error('Error creating memory:', error);
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

app.get('/api/memories/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const results = await memoryService.searchMemories(q);
    res.json(results);
  } catch (error) {
    console.error('Error searching memories:', error);
    res.status(500).json({ error: 'Failed to search memories' });
  }
});

app.get('/api/memories/:id', async (req: Request, res: Response) => {
  try {
    const memory = await memoryService.getMemory(req.params.id);
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    res.json(memory);
  } catch (error) {
    console.error('Error getting memory:', error);
    res.status(500).json({ error: 'Failed to get memory' });
  }
});

app.delete('/api/memories/:id', async (req: Request, res: Response) => {
  try {
    await memoryService.deleteMemory(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting memory:', error);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

app.put('/api/memories/:id', async (req: Request, res: Response) => {
  try {
    const { title, text, tags } = req.body;
    await memoryService.updateMemory(req.params.id, { title, text, tags });
    res.status(204).send();
  } catch (error) {
    console.error('Error updating memory:', error);
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

// Behavior endpoints
app.get('/api/behaviors', async (_req: Request, res: Response) => {
  try {
    const behaviors = await behaviorService.getAllBehaviors();
    res.json({ behaviors, totalResults: behaviors.length });
  } catch (error) {
    console.error('Error getting all behaviors:', error);
    res.status(500).json({ error: 'Failed to get behaviors' });
  }
});

app.post('/api/behaviors', async (req: Request, res: Response) => {
  try {
    const { text, tags } = req.body;
    const behavior = {
      text,
      date: new Date().toISOString(),
      tags: tags || [],
    };
    const id = await behaviorService.createBehavior(behavior);
    res.status(201).json({ id });
  } catch (error) {
    console.error('Error creating behavior:', error);
    res.status(500).json({ error: 'Failed to create behavior' });
  }
});

app.get('/api/behaviors/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const results = await behaviorService.searchBehaviors(q);
    res.json(results);
  } catch (error) {
    console.error('Error searching behaviors:', error);
    res.status(500).json({ error: 'Failed to search behaviors' });
  }
});

app.get('/api/behaviors/:id', async (req: Request, res: Response) => {
  try {
    const behavior = await behaviorService.getBehavior(req.params.id);
    if (!behavior) {
      return res.status(404).json({ error: 'Behavior not found' });
    }
    res.json(behavior);
  } catch (error) {
    console.error('Error getting behavior:', error);
    res.status(500).json({ error: 'Failed to get behavior' });
  }
});

app.delete('/api/behaviors/:id', async (req: Request, res: Response) => {
  try {
    await behaviorService.deleteBehavior(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting behavior:', error);
    res.status(500).json({ error: 'Failed to delete behavior' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
