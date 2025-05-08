# Lumi Server

A TypeScript-based Express server that provides a REST API for managing memories and behaviors using Weaviate as the vector database.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Weaviate instance with API key

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
WEAVIATE_URL=your_weaviate_url
WEAVIATE_API_KEY=your_weaviate_api_key
OPENAI_APIKEY=your_openai_api_key  # Required for text vectorization
PORT=3001 # Optional, defaults to 3001
```

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Memories

#### Create Memory
Creates a new memory entry in the database.

```
POST /api/memories
```

**Request Body:**
```json
{
  "title": "Memory Title",
  "text": "Your memory text here",
  "tags": ["tag1", "tag2"] // optional
}
```

**Response:**
```json
{
  "id": "memory-uuid"
}
```

#### Get Memory
Retrieves a specific memory by ID.

```
GET /api/memories/:id
```

**Response:**
```json
{
  "id": "memory-uuid",
  "title": "Memory Title",
  "text": "Memory text",
  "date": "2024-03-10T12:00:00Z",
  "tags": ["tag1", "tag2"]
}
```

#### Search Memories
Searches memories using semantic search.

```
GET /api/memories/search?q=search_text
```

**Query Parameters:**
- `q`: Search query text (required)

**Response:**
```json
{
  "memories": [
    {
      "id": "memory-uuid",
      "title": "Memory Title",
      "text": "Memory text",
      "date": "2024-03-10T12:00:00Z",
      "tags": ["tag1", "tag2"]
    }
  ],
  "totalResults": 1
}
```

#### Delete Memory
Deletes a specific memory by ID.

```
DELETE /api/memories/:id
```

**Response:**
- Status: 204 No Content

#### Get All Memories
Retrieves all memories from the database (limited to 100 entries).

```
GET /api/memories
```

**Response:**
```json
{
  "memories": [
    {
      "id": "memory-uuid",
      "title": "Memory Title",
      "text": "Memory text",
      "date": "2024-03-10T12:00:00Z",
      "tags": ["tag1", "tag2"]
    }
  ],
  "totalResults": 1
}
```

### Behaviors

#### Create Behavior
Creates a new behavior entry in the database.

```
POST /api/behaviors
```

**Request Body:**
```json
{
  "text": "Your behavior text here",
  "tags": ["tag1", "tag2"] // optional
}
```

**Response:**
```json
{
  "id": "behavior-uuid"
}
```

#### Get Behavior
Retrieves a specific behavior by ID.

```
GET /api/behaviors/:id
```

**Response:**
```json
{
  "id": "behavior-uuid",
  "text": "Behavior text",
  "date": "2024-03-10T12:00:00Z",
  "tags": ["tag1", "tag2"]
}
```

#### Search Behaviors
Searches behaviors using semantic search.

```
GET /api/behaviors/search?q=search_text
```

**Query Parameters:**
- `q`: Search query text (required)

**Response:**
```json
{
  "behaviors": [
    {
      "id": "behavior-uuid",
      "text": "Behavior text",
      "date": "2024-03-10T12:00:00Z",
      "tags": ["tag1", "tag2"]
    }
  ],
  "totalResults": 1
}
```

#### Delete Behavior
Deletes a specific behavior by ID.

```
DELETE /api/behaviors/:id
```

**Response:**
- Status: 204 No Content

#### Get All Behaviors
Retrieves all behaviors from the database (limited to 100 entries).

```
GET /api/behaviors
```

**Response:**
```json
{
  "behaviors": [
    {
      "id": "behavior-uuid",
      "text": "Behavior text",
      "date": "2024-03-10T12:00:00Z",
      "tags": ["tag1", "tag2"]
    }
  ],
  "totalResults": 1
}
```

## Error Responses

All endpoints may return the following error responses:

- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error response body:
```json
{
  "error": "Error message description"
}
```

## Data Models

### Memory
```typescript
{
  id?: string;      // UUID, auto-generated
  title: string;    // The title of the memory
  text: string;     // The memory content
  date: string;     // ISO date string
  tags: string[];   // Array of tags
}
```

### Behavior
```typescript
{
  id?: string;      // UUID, auto-generated
  text: string;     // The behavior content
  date: string;     // ISO date string
  tags: string[];   // Array of tags
}
```

## Technical Details

- Built with TypeScript and Express
- Uses Weaviate as vector database for semantic search capabilities
- Implements CORS for cross-origin requests
- Uses text2vec-openai vectorizer for semantic search functionality

## Development

The server uses `ts-node-dev` for development, which provides hot-reloading capabilities. Any changes to the source files will automatically restart the server.

## Production Deployment

For production deployment:

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

The compiled JavaScript files will be in the `dist` directory. 