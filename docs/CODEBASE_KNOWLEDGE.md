# CODEBASE KNOWLEDGE (Updated & Live)

## 1. High-Level Overview

**Note on Repository State**: The root `README.md` and the entire `/api` directory (a Laravel application) are legacy templates from a previous project. **They do not reflect the current application.** The single source of truth for the current project is the `/web` directory.

### Core Domain & Purpose
The application is **TelaahKarier (Career Risk Analyzer)**, an AI-powered web platform built for job seekers (fresh graduates, students, job hunters) to analyze digital job vacancy posts, detect red flags, verify company legitimacy, and provide safe next steps.

Users can input text, links, or job posters into a chat workspace, and the AI Engine responds with structured, explainable risk assessments (*Generative UI Cards*) and interactive action chips.

### Tech Stack (Frontend & AI Engine)
* **Framework**: Next.js 16 (App Router in `/web`).
* **Styling & UI**: TailwindCSS v4, Radix UI components (shadcn/ui), Framer Motion.
* **AI Engine**: LangChain (`@langchain/google-genai`, `@langchain/core`), Google Gemini API (`gemini-2.5-flash`), Tavily Web Search API (`tavily-search.ts`).
* **Streaming & Data Contract**: Vercel AI SDK Data Stream Protocol, Zod Schema validation (`schema.ts`).
* **State Management**: Zustand (`zustand`).
* **Package Manager**: pnpm.

---

## 2. System Architecture Deep Dive

The application operates with Next.js API Routes orchestrating a real, stateless LangChain AI Engine.

### Component Map & Data Flow
1. **User Interface**: The user interacts with the chat workspace (`/web/app/chat/page.tsx` and `/web/components/chat.tsx`).
2. **Next.js API Route**: The chat sends payloads to `/web/app/api/chat/route.ts`.
3. **AI Preprocessor**: Preprocesses input text, sanitizes input, extracts domains, and detects shortlinks/free email domains (`/web/langchain/agents/analyzer/preprocessor.ts`).
4. **Web Verification Tool**: Queries Tavily Search API (`/web/langchain/agents/analyzer/tools/tavily-search.ts`) to fetch live official references for mentioned companies.
5. **AI Analyzer Core Agent**: Invokes Google Gemini 2.5 Flash via `.withStructuredOutput(AnalysisSchema)` (`/web/langchain/agents/analyzer/analyze.ts`).
6. **Action Chips Agent**: Processes 5 interactive UI action requests (`/web/langchain/agents/analyzer/action-handler.ts`).
7. **Generative UI Stream**: Streams structured JSON parts (`data-reasoning`, `data-summary`, `data-claims`, `data-salary-benefit`, `data-risks`, `data-explanation`, `data-references`, `data-actions`) to the client, which renders interactive React cards.
8. **Deterministic Fallback Engine**: If LLM API limits or network errors occur, `buildSmartAnalysisFallback()` gracefully generates deterministic risk assessments without crashing the UI.

### State Management (Zustand)
* **`conversation-store.ts`**: Manages active chat state, messages, reasoning steps, and action responses.
* **`auth-store.ts`**: Manages user authentication and session states.

---

## 3. Feature-by-Feature Analysis

### Feature 1: AI Chat Interface (TelaahKarier)
* **Purpose**: Primary workspace for pasting job postings, URLs, or poster descriptions.
* **How it works**: Uses `useChat` hook connecting to `/api/chat`, supporting real-time data streaming and Generative UI Card rendering.

### Feature 2: Real AI Job Vacancy Analyzer Engine
* **Purpose**: Performs real-time risk triage and explainable AI analysis using Google Gemini.
* **How it works**:
  * Located in `/web/langchain/agents/analyzer/analyze.ts`.
  * **Live Engine**: Uses `getLLMModel()` with `gemini-2.5-flash` and inlined `AnalysisSchema`.
  * Evaluates claims, salary/benefit reasonableness, red flags (`overclaim`, `bias`, `missing_context`), and produces 1 clear Risk Level Verdict.
  * Fairly evaluates legitimate corporate postings (e.g., Flip, BCA, Shopee) as Low Risk when no scam indicators are found.

### Feature 3: Interactive UI Action Chips
* **Purpose**: Enables one-click sub-investigations ("Validate Company", "Check Red Flags", "Check Link & Contact", "Check Salary Reasonableness", "Safe Next Steps").
* **How it works**: Sends `UIActionPayload` to `/api/chat`, handled by `handleRealUIAction()` in `/web/langchain/agents/analyzer/action-handler.ts`.

---

## 4. Technical Nuances & Resolved Gotchas

* **Ignore Legacy Laravel API (`/api`)**: The root `/api` directory is leftover legacy code and is not used.
* **Gemini API `$ref` Limitation**: Gemini API's `response_schema` fails if Zod outputs `$ref` references. All sub-schemas in `schema.ts` are inlined to guarantee dereferenced JSON Schema.
* **Token Limit Ceiling**: `maxOutputTokens` is set to `8192` in `llm.ts` to ensure long structured JSON outputs are never truncated (`OUTPUT_PARSING_FAILURE`).
* **Input Echo Prevention**: `conversationText` in `schema.ts` contains `.describe("MUST ONLY contain AI opening greeting. NEVER copy the user's input text here.")` to prevent the AI from echoing the input text back.

---

## 5. Key File Locations in `/web`
* **`/app/chat/page.tsx` & `/components/chat.tsx`**: Main workspace UI views.
* **`/app/api/chat/route.ts`**: Next.js route streaming orchestrator.
* **`/langchain/agents/analyzer/analyze.ts`**: Core AI Analyzer agent & smart fallback.
* **`/langchain/agents/analyzer/llm.ts`**: Gemini/OpenAI singleton factory.
* **`/langchain/agents/analyzer/prompts.ts`**: System prompts & Explainable AI guardrails.
* **`/langchain/agents/analyzer/schema.ts`**: Inlined Zod data contract.
* **`/langchain/agents/analyzer/preprocessor.ts`**: Sanitizer & shortlink detector.
* **`/langchain/agents/analyzer/action-handler.ts`**: 5 UI Action Chips handler.
* **`/langchain/agents/analyzer/tools/tavily-search.ts`**: Tavily Web Search tool.
