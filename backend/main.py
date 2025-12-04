"""
FastAPI backend server for arXiv proxy and Gemini API
Handles CORS and routes API calls
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os
import sys
import json
import google.generativeai as genai

app = FastAPI(title="AIxiv Insights Backend API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
ARXIV_API_BASE_URL = 'https://export.arxiv.org/api/query'
PORT = int(os.environ.get('PROXY_PORT', 5000))
API_KEY = os.environ.get('API_KEY')
DEFAULT_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-2.0-flash-exp')

# Initialize Gemini if API key is available
if API_KEY:
    genai.configure(api_key=API_KEY)


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/api/arxiv/query")
async def proxy_arxiv(
    search_query: str,
    sortBy: Optional[str] = None,
    sortOrder: Optional[str] = None,
    start: Optional[int] = 0,
    max_results: Optional[int] = 10
):
    """
    Proxy endpoint for arXiv API queries
    Forwards all query parameters to arXiv API and returns the response
    """
    try:
        params = {
            "search_query": search_query,
            "start": start,
            "max_results": max_results
        }
        if sortBy:
            params["sortBy"] = sortBy
        if sortOrder:
            params["sortOrder"] = sortOrder
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(ARXIV_API_BASE_URL, params=params)
            response.raise_for_status()
            
            return Response(
                content=response.content,
                status_code=response.status_code,
                media_type="application/xml"
            )
    except httpx.RequestError as e:
        error_detail = f"{type(e).__name__}: {str(e)}"
        print(f"Error proxying arXiv request: {error_detail}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Failed to fetch from arXiv API: {error_detail}")
    except Exception as e:
        error_detail = f"{type(e).__name__}: {str(e)}"
        print(f"Unexpected error: {error_detail}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Unexpected error: {error_detail}")


class PaperSummary(BaseModel):
    id: str
    title: str
    summary: str


class GeminiThemesRequest(BaseModel):
    papers: List[PaperSummary]
    modelName: Optional[str] = None


@app.post("/api/gemini/themes")
async def get_gemini_themes(request: GeminiThemesRequest):
    """
    Proxy endpoint for Gemini API theme clustering
    """
    try:
        if not API_KEY:
            raise HTTPException(
                status_code=500,
                detail="Server is not configured with API_KEY"
            )
        
        if not request.papers or len(request.papers) == 0:
            return {"themes": []}
        
        model_name = request.modelName if request.modelName else DEFAULT_MODEL
        
        prompt = f"""
Given the following list of AI preprint titles and summaries:
{json.dumps([{"id": p.id, "title": p.title, "summary": p.summary} for p in request.papers], indent=2)}

Please perform the following tasks:
1. Identify the main research themes present in these preprints. Aim for 5-7 distinct themes.
2. For each identified theme, provide a short, descriptive name.
3. Count how many papers fall under each theme.

Return the result ONLY as a valid JSON object with the following structure:
{{
  "themes": [
    {{ "name": "Theme Name 1", "count": number_of_papers_in_theme_1 }},
    {{ "name": "Theme Name 2", "count": number_of_papers_in_theme_2 }}
  ]
}}

Ensure the theme names are concise and accurately represent the content. Focus on the core topics.
If there are very few papers or they are too diverse to form meaningful clusters, return an empty themes array or a JSON with "themes": [].
Do not include any explanatory text before or after the JSON object.
"""
        
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.2,
            }
        )
        
        text = response.text.strip()
        # Remove markdown code fences if present
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
        
        parsed = json.loads(text)
        themes = parsed.get("themes", [])
        
        if not isinstance(themes, list):
            themes = []
        
        return {"themes": themes}
        
    except json.JSONDecodeError as e:
        print(f"Error parsing Gemini response: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="Failed to parse Gemini API response")
    except Exception as e:
        print(f"Gemini API error: {e}", file=sys.stderr)
        error_msg = str(e) if isinstance(e, Exception) else "Unknown error"
        raise HTTPException(status_code=500, detail=f"Gemini API error: {error_msg}")


if __name__ == "__main__":
    import uvicorn
    
    print(f"\n{'='*60}")
    print(f"  AIxiv Insights Backend API (FastAPI)")
    print(f"{'='*60}")
    print(f"  Server running on: http://localhost:{PORT}")
    print(f"  Health check: http://localhost:{PORT}/health")
    print(f"  ArXiv proxy: http://localhost:{PORT}/api/arxiv/query")
    print(f"  Gemini API: http://localhost:{PORT}/api/gemini/themes")
    print(f"  API docs: http://localhost:{PORT}/docs")
    print(f"{'='*60}\n")
    sys.stdout.flush()
    
    uvicorn.run(app, host="0.0.0.0", port=PORT)

