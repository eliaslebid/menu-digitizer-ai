# Menu AI Agent System

> **Note**: The technical assignment document is located in the [`docs/`](./docs/) folder.

A stateful multi-agent system for digitizing restaurant menus, identifying vegetarian options, and calculating totals. Built with Node.js, Express, LangChain, and ChromaDB.

## Architecture

The system is split into three microservices:

1.  **Web App (`services/web-app`)**:
    *   **Role**: User Interface.
    *   **Stack**: React 18 + TypeScript + Vite + Framer Motion.
    *   **Features**: Drag-and-drop menu upload, real-time results, premium glassmorphic design.

2.  **API Gateway (`services/api-gateway`)**:
    *   **Role**: Orchestrator & Ingestion.
    *   **Stack**: Express, Tesseract.js (OCR), Regex Parsing.
    *   **Responsibility**: Handles image upload, runs OCR, parses text into structured `MenuItem` objects, and delegates classification to the MCP Agent.

3.  **MCP Agent (`services/mcp-agent`)**:
    *   **Role**: Reasoning & Knowledge Base.
    *   **Stack**: Express, LangChain.js, ChromaDB, OpenAI.
    *   **Responsibility**: Classifies items as Vegetarian/Non-Veg using a 3-step process:
        1.  **Keyword Heuristics**: Fast check for obvious items ("Steak", "Tofu").
        2.  **RAG Retrieval**: Looks up ingredients in a local ChromaDB vector store.
        3.  **LLM Reasoning**: Uses GPT to make the final decision based on item details and retrieved context.

## Prerequisites

*   Docker & Docker Compose (recommended)
*   Node.js 18+ (for local dev)
*   OpenAI API Key (for the LLM agent)

## Quick Start

### Option 1: Using Docker (Recommended)

1.  **Clone & Setup**:
    ```bash
    cd menu-ai-monorepo
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root:
    ```bash
    OPENAI_API_KEY=sk-...
    LANGCHAIN_TRACING_V2=true
    LANGCHAIN_API_KEY=ls-...
    ```

3.  **Run with Docker**:
    ```bash
    docker compose up --build
    ```
    This starts:
    *   **Web App**: `http://localhost:5173`
    *   **API Gateway**: `http://localhost:3000`
    *   **MCP Agent**: `http://localhost:3001`
    *   **ChromaDB**: `http://localhost:8000`

4.  **Seed the Knowledge Base**:
    ```bash
    docker compose exec mcp-agent npm run start:seed
    ```

5.  **Access the App**:
    Open `http://localhost:5173` in your browser and drag menu images to upload.

### Option 2: Local Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Services** (in separate terminals):
    ```bash
    # Terminal 1: Start ChromaDB (requires Docker)
    docker run -p 8000:8000 chromadb/chroma:latest
    
    # Terminal 2: Start MCP Agent
    cd services/mcp-agent
    npm run start:seed  # Seed the knowledge base first
    npm run dev
    
    # Terminal 3: Start API Gateway
    cd services/api-gateway
    npm run dev
    
    # Terminal 4: Start Web App
    cd services/web-app
    npm run dev
    ```

3.  **Access**: Open `http://localhost:5173`

## Testing

Run unit tests:
```bash
npm test
```

## Observability

Traces are sent to **LangSmith**. Check your project dashboard to see the full chain of thought:
`API Request` -> `OCR` -> `Parser` -> `MCP Agent` -> `RAG Lookup` -> `LLM Decision`.
