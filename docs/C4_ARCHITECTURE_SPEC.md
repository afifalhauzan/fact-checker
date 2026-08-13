# DOKUMEN ARSITEKTUR C4 MODEL & DIAGRAM UML
## TelaahKarier — System Architecture & AI Engine Specification

| Atribut Dokumen | Detail |
|---|---|
| **Nama Sistem** | TelaahKarier (Platform AI Interaktif Analisis Risiko Lowongan Kerja) |
| **Paradigma Arsitektur** | C4 Model (Context, Container, Component, Code) & Standard UML |
| **Versi Dokumen** | 2.1.0 (Live Production & Fixed Schema Edition) |
| **Target Event** | GEMASTIK — Pengembangan Perangkat Lunak |
| **Penyusun** | Tim Kelaz king (Universitas Brawijaya) |
| **Status** | **Fully Implemented & Verified** |

---

# EXECUTIVE SUMMARY

Dokumen ini menyajikan arsitektur sistem **TelaahKarier** dengan menggabungkan **Paradigma C4 Model** dan notasi **UML (Unified Modeling Language)** standar. Seluruh diagram digambar menggunakan sintaks **Mermaid UML** yang kompatibel dengan GitHub, VS Code, dan platform dokumentasi teknis.

```
┌─────────────────────────────────────────────────────────────┐
│ LEVEL 1: C4 CONTEXT & UML USE CASE DIAGRAM                  │
│ Aktor, Batas Sistem, & Kasus Penggunaan Utama               │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ LEVEL 2: C4 CONTAINER & UML DEPLOYMENT DIAGRAM              │
│ Node Komputasi, Aplikasi Web, API Route, & External APIs    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ LEVEL 3: C4 COMPONENT & UML SEQUENCE DIAGRAM                │
│ Komponen Internal AI Engine & Alur Interaksi Pesan          │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ LEVEL 4: C4 CODE & UML CLASS DIAGRAM                        │
│ Struktur Kelas, Type Definition, & Zod Schemas              │
└─────────────────────────────────────────────────────────────┘
```

---

# LEVEL 1: SYSTEM CONTEXT & UML USE CASE DIAGRAM

## 1.1 Context System Overview
Platform **TelaahKarier** berfungsi sebagai workspace kecerdasan buatan (*AI Workspace*) untuk mengevaluasi risiko penipuan lowongan kerja digital.

## 1.2 UML Use Case Diagram

Diagram Use Case UML menggambarkan aktor pengguna dan kasus penggunaan (*use cases*) utama di dalam sistem TelaahKarier:

```mermaid
graph LR
    subgraph Actors["Aktor Sistem"]
        JobSeeker["Pencari Kerja / Fresh Graduate"]
        Counselor["Konselor BKK / Kampus"]
    end

    subgraph TelaahKarier["<<System>> TelaahKarier Platform"]
        UC1["UC-01: Input Lowongan Multimodal\n(Teks / Link / Poster)"]
        UC2["UC-02: Lihat Analisis Risiko Awal\n(Risk Triage & Claims)"]
        UC3["UC-03: Lihat Reasoning Step AI\n(Thinking Process Stream)"]
        UC4["UC-04: Eksekusi Action Chips\n(Validasi Perusahaan, Red Flag, dll)"]
        UC5["UC-05: Verifikasi Rujukan & Sitasi\n(Sumber Web Resmi & Portal)"]
        UC6["UC-06: Mengikuti Rekomendasi Langkah Aman"]
    end

    subgraph ExternalSystems["Layanan Eksternal"]
        LLM["Google Gemini / OpenAI API"]
        SearchAPI["Tavily Search API"]
    end

    JobSeeker --> UC1
    JobSeeker --> UC2
    JobSeeker --> UC3
    JobSeeker --> UC4
    JobSeeker --> UC5
    JobSeeker --> UC6

    Counselor --> UC2
    Counselor --> UC5

    UC1 -. "<<include>>" .-> LLM
    UC2 -. "<<include>>" .-> LLM
    UC4 -. "<<include>>" .-> LLM
    UC4 -. "<<extend>>" .-> SearchAPI
    UC5 -. "<<include>>" .-> SearchAPI
```

---

# LEVEL 2: C4 CONTAINER & UML DEPLOYMENT DIAGRAM

Level 2 memetakan bagaimana kontainer aplikasi dipetakan ke dalam node infrastruktur dan *deployment environment*.

## 2.1 UML Component Architecture Diagram (Level 2 Containers)

```mermaid
graph TB
    subgraph ClientDevice["<<Device>> Client Environment"]
        Browser["<<Container>> Web Browser\n(User Desktop / Mobile)"]
        LocalStorage["<<Container>> Local Storage & Cookies\n(State & Session Storage)"]
    end

    subgraph WebServerContainer["<<Node>> Next.js Server Environment"]
        subgraph MonorepoApp["/web App Package"]
            FrontendApp["<<Component>> Web Frontend App\n(Next.js App Router, React 19, Tailwind)"]
            APIRoute["<<Component>> Stream Orchestrator\n(/api/chat Route Handler)"]
            AIEngine["<<Component>> LangChain AI Agent Engine\n(/langchain/agents/analyzer/)"]
        end
    end

    subgraph ExternalCloudServices["<<Cloud>> External API Providers"]
        GeminiService["<<External System>> Google Gemini 2.5 API\n(LLM Inference & Vision OCR)"]
        TavilyService["<<External System>> Tavily Web Search API\n(Domain & Fact Check)"]
    end

    Browser -- "1. HTTP GET/POST (User Action)" --> FrontendApp
    FrontendApp <--> LocalStorage
    FrontendApp -- "2. POST /api/chat (JSON Payload)" --> APIRoute
    APIRoute -- "3. Function Call (In-Memory)" --> AIEngine
    AIEngine -- "4. gRPC/HTTPS API Call" --> GeminiService
    AIEngine -- "5. REST API Call" --> TavilyService
    APIRoute -- "6. HTTP Data Stream Protocol (SSE)" --> FrontendApp
```

## 2.2 UML Deployment Diagram

Diagram Penyebaran (*Deployment Diagram*) menggambarkan simpul fisik komputasi saat aplikasi berjalan di lingkungan produksi (Vercel / Cloud Run):

```mermaid
graph TD
    nodeUser["<<Node: Device>>\nPengguna (Desktop / Smartphone)\n[OS: Windows/macOS/Android/iOS]"]
    nodeVercel["<<Node: Execution Environment>>\nVercel Cloud / Node.js Runtime"]
    
    subgraph VercelDeployment["Vercel Edge & Serverless Platform"]
        artifactNextStatic["<<Artifact>>\nNext.js Static Assets & Bundle\n(HTML, CSS, JS Bundle)"]
        artifactRouteHandler["<<Artifact>>\nServerless Function Handler\n(/api/chat/route.ts)"]
    end

    subgraph LLMCloud["<<Cloud Provider>>\nGoogle Cloud Platform / OpenAI"]
        apiGemini["<<Service>>\nGemini API Endpoint"]
    end

    subgraph SearchCloud["<<Cloud Provider>>\nTavily Inc."]
        apiTavily["<<Service>>\nTavily Search Endpoint"]
    end

    nodeUser -- "HTTPS (Port 443)\nFetch & EventSource Stream" --> nodeVercel
    nodeVercel --- artifactNextStatic
    nodeVercel --- artifactRouteHandler

    artifactRouteHandler -- "HTTPS (Port 443)\nStructured Output API" --> apiGemini
    artifactRouteHandler -- "HTTPS (Port 443)\nWeb Search Query" --> apiTavily
```

---

# LEVEL 3: C4 COMPONENT & UML SEQUENCE DIAGRAM

Level 3 menyajikan alur interaksi internal antar-komponen AI Engine saat memproses analisis lowongan kerja dan aksi pengguna.

## 3.1 UML Component Diagram (AI Engine Internal)

```mermaid
graph LR
    subgraph APIModule["/web/app/api/chat/"]
        RouteHandler["<<Component>>\nroute.ts\n(Stream Orchestrator)"]
    end

    subgraph AIEngineModule["/web/langchain/agents/analyzer/"]
        Preprocessor["<<Component>>\npreprocessor.ts\n(Sanitizer & Vision OCR)"]
        LLMFactory["<<Component>>\nllm.ts\n(LLM Model Singleton, maxTokens: 8192)"]
        Prompts["<<Component>>\nprompts.ts\n(System Prompts & Guardrails)"]
        CoreAgent["<<Component>>\nanalyze.ts\n(Main Risk Analyzer Agent)"]
        ActionAgent["<<Component>>\naction-handler.ts\n(5 UI Action Chips Agent)"]
        WebTool["<<Component>>\ntools/tavily-search.ts\n(Web Verification Tool)"]
        SchemaRegistry["<<Component>>\nschema.ts\n(Inlined Zod Schema Validation)"]
    end

    RouteHandler --> Preprocessor
    Preprocessor --> CoreAgent
    RouteHandler --> ActionAgent

    CoreAgent --> Prompts
    CoreAgent --> LLMFactory
    CoreAgent --> WebTool
    CoreAgent --> SchemaRegistry

    ActionAgent --> Prompts
    ActionAgent --> LLMFactory
```

## 3.2 UML Sequence Diagram: End-to-End Chat & Analysis Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna (User)
    participant UI as Chat UI (React Component)
    participant Route as Stream Orchestrator (route.ts)
    participant Pre as Preprocessor (preprocessor.ts)
    participant Agent as Core AI Agent (analyze.ts)
    participant Tool as Tavily Search Tool
    participant LLM as Gemini LLM Model

    User->>UI: Input Teks / Link / Poster Lowongan
    UI->>Route: HTTP POST /api/chat (Messages Payload)
    Route->>Pre: sanitizeAndExtract(input)
    Pre-->>Route: Clean Text & Extracted Links
    
    Route->>Agent: analyzeContent(cleanInput)
    Agent->>Tool: executeSearch(companyName / URL)
    Tool->>Tool: Query Web Index
    Tool-->>Agent: References & Evidences Array
    
    Agent->>LLM: invokeWithStructuredOutput(prompt, AnalysisSchema)
    LLM-->>Agent: JSON Object (AnalysisResult)
    Agent-->>Route: Validated AnalysisResult Object

    rect rgb(245, 247, 250)
        note over Route, UI: Progressive Data Stream Protocol Dispatching
        Route->>UI: Stream Event: data-reasoning (Snapshots)
        UI->>User: Render Reasoning Component (Thinking process)
        Route->>UI: Stream Event: text-start/delta/end (Conversational intro)
        Route->>UI: Stream Event: data-summary (Risk summary)
        UI->>User: Render SummaryCard Component
        Route->>UI: Stream Event: data-claims (Risk level & Confidence)
        UI->>User: Render ClaimCard Component
        Route->>UI: Stream Event: data-salary-benefit
        UI->>User: Render SalaryBenefitCard Component
        Route->>UI: Stream Event: data-risks (Red Flags)
        UI->>User: Render RiskCard Components
        Route->>UI: Stream Event: data-explanation
        UI->>User: Render ExplanationCard Components
        Route->>UI: Stream Event: data-references
        UI->>User: Render ReferenceCard & Update Context Panel
        Route->>UI: Stream Event: data-actions (5 UI Action Chips)
        UI->>User: Render Action Chips Buttons
    end
```

## 3.3 UML Sequence Diagram: UI Action Chip Click Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna (User)
    participant UI as Chat UI (Action Button)
    participant Route as Stream Orchestrator (route.ts)
    participant ActionHandler as Action Agent (action-handler.ts)
    participant LLM as Gemini LLM Model

    User->>UI: Klik Tombol "Validasi Perusahaan" (UI Action Chip)
    UI->>Route: HTTP POST /api/chat (action_payload: UIActionPayload)
    Route->>ActionHandler: handleUIAction(payload, previousContext)
    ActionHandler->>LLM: invokeActionPrompt(actionId, context)
    LLM-->>ActionHandler: JSON Output (ActionInsightResult)
    ActionHandler-->>Route: ActionInsightResult Object

    Route->>UI: Stream Event: text-start/delta/end (Opening Narrative)
    Route->>UI: Stream Event: data-action-insight (Checklist Points)
    UI->>User: Render ActionInsightCard Component
    Route->>UI: Stream Event: data-actions (Re-render Action Chips)
```

---

# LEVEL 4: C4 CODE & UML CLASS DIAGRAM

Level 4 menyajikan arsitektur tipe data, skema validasi, dan keterhubungan antar-kelas/skema Zod di tingkat kode.

## 4.1 UML Class Diagram (Inlined Schemas & Data Models)

```mermaid
classDiagram
    class AnalysisResult {
        +String conversationText
        +Claim[] claims
        +SalaryBenefitAssessment salaryBenefit
        +Risk[] risks
        +String summary
        +Citation[] summaryCitations
        +ExplanationItem[] explanations
        +String[] suggestedQuestions
        +Reasoning[] reasoning
        +Reference[] references
    }

    class Claim {
        +String text
        +Number confidence
    }

    class Risk {
        +RiskType type
        +String description
    }

    class RiskType {
        <<enumeration>>
        bias
        overclaim
        missing_context
    }

    class Reasoning {
        +String intent
        +String[] steps
    }

    class SalaryBenefitAssessment {
        +String title
        +String status
        +String summary
        +String[] highlights
        +String hint
    }

    class ExplanationItem {
        +String title
        +String explanation
    }

    class Reference {
        +String title
        +String snippet
        +String url
        +Citation[] citations
    }

    class Citation {
        +String id
        +String label
        +String title
        +String link
    }

    class UIActionPayload {
        +String type
        +UIActionId actionId
        +String actionLabel
        +String sourceMessageId
        +String claim
        +String context
        +AttachmentMetadata attachment
    }

    class UIActionId {
        <<enumeration>>
        validate_company
        check_red_flags
        check_link_contact
        check_salary_benefit_reasonableness
        safe_next_steps
    }

    AnalysisResult *-- Claim : contains
    AnalysisResult *-- Risk : contains
    AnalysisResult *-- Reasoning : contains
    AnalysisResult *-- SalaryBenefitAssessment : optional
    AnalysisResult *-- ExplanationItem : contains
    AnalysisResult *-- Reference : contains
    Risk *-- RiskType : uses
    Reference *-- Citation : contains
    UIActionPayload *-- UIActionId : uses
```

---

# BAB 5: RANGKUMAN KEPATUHAN UML & C4

Dokumen spesifikasi arsitektur berbasis **UML dan C4 Model** ini menjamin:

1. **Kejelasan Hubungan System Context**: Pengguna dan layanan cloud eksternal terhubung secara transparan melalui protokol HTTPS standar.
2. **Fleksibilitas Kontainer (Level 2)**: Next.js App Router bertindak sebagai pembungkus (*wrapper*) stateless yang siap di-scale ke lingkungan cloud modern.
3. **Ketegasan Komponen Internal AI (Level 3)**: Pemisahan tugas antara `route.ts`, `preprocessor.ts`, `analyze.ts`, `schema.ts`, dan `action-handler.ts` memastikan kode bersih (*Clean Code*) dan ter-inlined untuk kompatibilitas penuh Gemini API.
4. **Validasi Tipe Data Tanpa Celah (Level 4)**: Seluruh pemancaran stream terikat pada Zod Schema yang menjamin antarmuka React tidak akan mengalami error tipe data saat merender kartu analisis.
