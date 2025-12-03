<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/16NcfgHT5BDO68DtxfvagtmgIAsKm92Cp

## Run Locally

**Prerequisites:**  
- Node.js
- Python 3.7+ (for CORS proxy server)

### Setup

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```
   
   Or use a virtual environment (recommended):
   ```bash
   cd backend
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   pip install -r requirements.txt
   cd ..
   ```

3. **Set the `API_KEY` in `.env` (or `.env.local`) to your Gemini API key:**
   ```
   API_KEY=your_gemini_api_key_here
   ```

### Development

Run both frontend and proxy server:
```bash
npm run dev
```

This will start:
- **Frontend (Vite)**: http://localhost:43123 - Dashboard and UI
- **Python Proxy Server**: http://localhost:5000 - Handles CORS for arXiv API calls

The proxy server routes arXiv API requests to avoid CORS errors. Both servers will run concurrently and their URLs will be displayed in the console.

See [backend/README.md](backend/README.md) for more details about the proxy server.
