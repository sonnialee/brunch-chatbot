# Brunch Chatbot Design
**Date**: 2026-02-13
**Author**: Claude + Sonnia
**Status**: Approved

## Overview

A conversational AI chatbot that provides advice based on 26 Brunch articles about career transitions, resume writing, AI usage, and PM work. Users can ask questions and receive personalized advice drawn from the author's written content.

**Target Users**: People seeking career advice (job hunting, resume writing, career transitions)
**Primary Use Case**: Advisory bot → Personal branding tool

## Architecture

### System Architecture

```
User Browser
    ↓
Next.js App (Vercel)
├── Frontend (React)
│   └── Chat UI
│
└── Backend (API Routes)
    ├── /api/crawl → Brunch article crawler
    ├── /api/chat → Claude API integration
    └── Article data caching (memory/file)
```

### Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Anthropic Claude API (claude-3-5-sonnet)
- **Deployment**: Vercel (free tier)
- **Crawling**: Cheerio (HTML parsing)

### Project Structure

```
brunch-chatbot/
├── app/
│   ├── page.tsx              # Main chat UI
│   └── api/
│       ├── chat/route.ts     # Claude API handler
│       └── crawl/route.ts    # Brunch crawler endpoint
├── lib/
│   ├── brunch-crawler.ts     # Article fetching logic
│   └── claude-client.ts      # Claude API wrapper
├── data/
│   └── articles.json         # Cached article content
└── public/
```

## Components

### Frontend Components

**ChatInterface** (Main screen)
- Message list (scrollable)
- Input field for questions
- Send button
- Loading indicator
- Header with title

**MessageBubble**
- User messages (right-aligned, blue)
- AI responses (left-aligned, gray)
- Optional timestamps

### Backend Components

**BrunchCrawler** (`/lib/brunch-crawler.ts`)
- Fetch article list from Brunch API
- Parse HTML to extract text content
- Store as JSON: `{ title, url, content, date }`
- Source: https://brunch.co.kr/@103ab3ed4f1f4f6 (26 articles)

**ClaudeClient** (`/lib/claude-client.ts`)
- Anthropic SDK wrapper
- System prompt generation (includes all 26 articles)
- Conversation history management
- Optional streaming responses

**API Routes**
- `/api/crawl`: Trigger article crawling (manual/automatic)
- `/api/chat`: POST endpoint - receives question, returns Claude response

## Data Flow

### Core Flow

1. **Initial Load**: Crawl 26 Brunch articles (or load pre-crawled data)
2. **User Question**: User types question in chat UI
3. **API Call**: `/api/chat` sends question + all articles to Claude
4. **Response**: Claude's answer displayed in chat

### Context Strategy

**Full Context Loading** (chosen for prototype)
- All 26 articles loaded into Claude's system prompt
- Simple and fast implementation
- Claude's long context window handles this well
- Future: Can migrate to RAG if article count grows significantly

## Error Handling

**Key Error Scenarios:**

- **Crawling Failure**: Fall back to local backup data
- **Claude API Error**: Display "Sorry, please try again later"
- **Network Timeout**: Show retry button
- **Rate Limiting**: Queue requests or show wait message

## Testing

**Prototype Phase:**
- Manual testing sufficient
- Test with real questions like:
  - "이직할 때 이력서 어떻게 써야 해?"
  - "AI로 업무 효율 높이는 방법은?"
  - "포트폴리오에 뭘 넣어야 해?"
- Post-deployment: Iterative improvement based on usage

## MVP Features

**Must Have:**
- Question input and answer display
- Session-based conversation history
- Clean chat interface
- Brunch article crawler
- Claude API integration

**Won't Have (v1):**
- Persistent chat history (no database)
- Multi-session management
- User authentication
- Chat history export

## Deployment

**Platform**: Vercel
**Process**:
1. Push to GitHub
2. Connect to Vercel
3. Auto-deploy on push

**Environment Variables:**
- `ANTHROPIC_API_KEY`: Claude API key

**Cost**: Free tier (sufficient for prototype)

## Future Enhancements

- Add LocalStorage for chat persistence
- Implement RAG for better scaling
- Add Supabase for user accounts and chat history
- Embed widget for portfolio site
- Analytics for popular questions
