# Backend API Server

FastAPI server that handles both arXiv API proxying and Gemini API calls to avoid CORS issues.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

   Or use a virtual environment (recommended):
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   Create a `.env` file in the project root (or set environment variables):
   ```
   API_KEY=your_gemini_api_key_here
   PROXY_PORT=5000
   GEMINI_MODEL=gemini-2.0-flash-exp
   ```

3. **Run the server:**
   ```bash
   python main.py
   ```

## Configuration

The server uses the following environment variables:

- `API_KEY`: Your Google Gemini API key (required for Gemini endpoints)
- `PROXY_PORT`: Port for the backend server (default: 5000)
- `GEMINI_MODEL`: Default Gemini model to use (default: gemini-2.0-flash-exp)

Example:
```bash
API_KEY=your_key PROXY_PORT=5000 python main.py
```

## API Endpoints

### Health Check
- `GET /health` - Health check endpoint
  - Returns: `{"status": "healthy"}`

### arXiv Proxy
- `GET /api/arxiv/query` - Proxy endpoint for arXiv API queries
  - Query Parameters:
    - `search_query` (required): arXiv search query
    - `sortBy` (optional): Sort method
    - `sortOrder` (optional): Sort order
    - `start` (optional): Start index (default: 0)
    - `max_results` (optional): Max results (default: 10)
  - Returns: XML response from arXiv API

### Gemini API
- `POST /api/gemini/themes` - Generate paper themes using Gemini
  - Request Body:
    ```json
    {
      "papers": [
        {"id": "123", "title": "Paper Title", "summary": "Paper summary..."}
      ],
      "modelName": "gemini-2.0-flash-exp" // optional
    }
    ```
  - Returns:
    ```json
    {
      "themes": [
        {"name": "Theme Name", "count": 5}
      ]
    }
    ```

## Interactive API Documentation

FastAPI provides automatic interactive API documentation:
- Swagger UI: http://localhost:5000/docs
- ReDoc: http://localhost:5000/redoc

## Testing

Test the API endpoints:

```bash
# Health check
curl http://localhost:5000/health

# Test arXiv query
curl "http://localhost:5000/api/arxiv/query?search_query=cat:cs.AI&max_results=5"

# Test Gemini themes (requires API_KEY)
curl -X POST http://localhost:5000/api/gemini/themes \
  -H "Content-Type: application/json" \
  -d '{"papers": [{"id": "test", "title": "Test", "summary": "Test summary"}]}'
```

