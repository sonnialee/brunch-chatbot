# Brunch Chatbot Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Next.js chatbot that answers questions based on 26 Brunch articles using Claude API

**Architecture:** Full-stack Next.js app with React chat UI, API routes for Brunch crawling and Claude integration, deployed to Vercel

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Claude API, Cheerio (crawling)

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: Next.js project structure
- Create: `.env.example`
- Create: `package.json`

**Step 1: Initialize Next.js with TypeScript and Tailwind**

```bash
cd ~/brunch-chatbot
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

Expected: Next.js project scaffolded with App Router

**Step 2: Install dependencies**

```bash
npm install @anthropic-ai/sdk cheerio
npm install -D @types/node
```

**Step 3: Create environment file template**

Create `.env.example`:
```
ANTHROPIC_API_KEY=your_api_key_here
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: initialize Next.js project with dependencies"
```

---

## Task 2: Brunch Crawler

**Files:**
- Create: `lib/brunch-crawler.ts`
- Create: `lib/types.ts`
- Create: `app/api/crawl/route.ts`

**Step 1: Define types**

Create `lib/types.ts`:
```typescript
export interface BrunchArticle {
  title: string;
  url: string;
  content: string;
  date?: string;
}
```

**Step 2: Implement Brunch crawler**

Create `lib/brunch-crawler.ts`:
```typescript
import * as cheerio from 'cheerio';
import type { BrunchArticle } from './types';

const BRUNCH_PROFILE = '@103ab3ed4f1f4f6';
const BRUNCH_API_BASE = 'https://api.brunch.co.kr/v1';

export async function fetchArticleList(): Promise<{ title: string; url: string }[]> {
  try {
    const response = await fetch(`${BRUNCH_API_BASE}/article/${BRUNCH_PROFILE}`);
    const data = await response.json();

    return data.articles.map((article: any) => ({
      title: article.title,
      url: `https://brunch.co.kr/${article.url}`
    }));
  } catch (error) {
    console.error('Failed to fetch article list:', error);
    throw error;
  }
}

export async function fetchArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract main content
    const content = $('.wrap_body')
      .find('p, h1, h2, h3, h4, li')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 0)
      .join('\n\n');

    return content;
  } catch (error) {
    console.error(`Failed to fetch content from ${url}:`, error);
    throw error;
  }
}

export async function crawlAllArticles(): Promise<BrunchArticle[]> {
  const articleList = await fetchArticleList();

  const articles: BrunchArticle[] = [];

  for (const { title, url } of articleList) {
    try {
      const content = await fetchArticleContent(url);
      articles.push({ title, url, content });

      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to crawl ${url}:`, error);
    }
  }

  return articles;
}
```

**Step 3: Create crawl API route**

Create `app/api/crawl/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { crawlAllArticles } from '@/lib/brunch-crawler';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const articles = await crawlAllArticles();

    // Save to data directory
    const dataDir = path.join(process.cwd(), 'data');
    await writeFile(
      path.join(dataDir, 'articles.json'),
      JSON.stringify(articles, null, 2)
    );

    return NextResponse.json({
      success: true,
      count: articles.length,
      message: 'Articles crawled and saved successfully'
    });
  } catch (error) {
    console.error('Crawl error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to crawl articles' },
      { status: 500 }
    );
  }
}
```

**Step 4: Create data directory**

```bash
mkdir -p data
echo '[]' > data/articles.json
```

**Step 5: Test crawler locally (optional)**

```bash
npm run dev
# Visit http://localhost:3000/api/crawl
```

**Step 6: Commit**

```bash
git add lib/ app/api/crawl/ data/
git commit -m "feat: add Brunch article crawler"
```

---

## Task 3: Claude API Client

**Files:**
- Create: `lib/claude-client.ts`
- Create: `app/api/chat/route.ts`

**Step 1: Implement Claude client**

Create `lib/claude-client.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk';
import type { BrunchArticle } from './types';
import { readFile } from 'fs/promises';
import path from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function loadArticles(): Promise<BrunchArticle[]> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'articles.json');
    const data = await readFile(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load articles:', error);
    return [];
  }
}

export function buildSystemPrompt(articles: BrunchArticle[]): string {
  const articlesText = articles
    .map((article, index) => {
      return `
## 글 ${index + 1}: ${article.title}
URL: ${article.url}

${article.content}
`;
    })
    .join('\n---\n');

  return `당신은 커리어 조언을 제공하는 AI 어시스턴트입니다.

아래는 "셩PM"이 작성한 26개의 브런치 글입니다. 이 글들을 기반으로 사용자의 질문에 답변해주세요.

답변 가이드라인:
- 제공된 글의 내용을 기반으로 구체적이고 실용적인 조언을 제공하세요
- 가능한 경우 관련 글의 제목이나 내용을 언급하세요
- 글에 없는 내용은 일반적인 조언으로 보완하되, 출처를 구분해주세요
- 친근하고 도움이 되는 톤으로 답변하세요
- 한국어로 답변하세요

---

# 브런치 글 모음

${articlesText}`;
}

export async function chat(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
) {
  const articles = await loadArticles();
  const systemPrompt = buildSystemPrompt(articles);

  const messages = [
    ...conversationHistory,
    { role: 'user' as const, content: userMessage }
  ];

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    system: systemPrompt,
    messages: messages,
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : '';
}
```

**Step 2: Create chat API route**

Create `app/api/chat/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { chat } from '@/lib/claude-client';

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await chat(message, history || []);

    return NextResponse.json({
      success: true,
      response
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
```

**Step 3: Commit**

```bash
git add lib/claude-client.ts app/api/chat/
git commit -m "feat: add Claude API client and chat endpoint"
```

---

## Task 4: Chat UI

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Step 1: Create chat interface**

Replace `app/page.tsx`:
```typescript
'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages([...newMessages, {
          role: 'assistant',
          content: data.response
        }]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([...newMessages, {
        role: 'assistant',
        content: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          셩PM의 브런치 조언 봇
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          이직, 이력서, AI 활용에 대한 조언을 받아보세요
        </p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-2">👋 안녕하세요!</p>
            <p>궁금한 것을 물어보세요. 예:</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>"이직할 때 이력서 어떻게 써야 해?"</li>
              <li>"포트폴리오에 뭘 넣어야 해?"</li>
              <li>"AI로 업무 효율 높이는 방법은?"</li>
            </ul>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-3xl px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="질문을 입력하세요..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            전송
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Update global styles**

Modify `app/globals.css` to keep Tailwind directives:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 3: Test the UI**

```bash
npm run dev
# Visit http://localhost:3000
```

**Step 4: Commit**

```bash
git add app/
git commit -m "feat: add chat UI with message history"
```

---

## Task 5: Setup Environment and Documentation

**Files:**
- Create: `.env.local` (not committed)
- Update: `README.md`

**Step 1: Create local environment file**

```bash
cp .env.example .env.local
# Manually add your ANTHROPIC_API_KEY
```

**Step 2: Update README**

Update `README.md`:
```markdown
# Brunch Chatbot

AI 챗봇으로 브런치 글 기반 커리어 조언 제공

## 기능

- 26개 브런치 글 기반 대화형 AI
- 이직, 이력서, PM 업무, AI 활용 관련 조언
- Claude API 기반 자연스러운 대화
- 실시간 채팅 인터페이스

## 기술 스택

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Claude API (Anthropic)
- Vercel 배포

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일에 Anthropic API 키 추가:
```
ANTHROPIC_API_KEY=your_actual_api_key_here
```

### 3. 브런치 글 크롤링

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 크롤링 실행
# http://localhost:3000/api/crawl 방문
```

### 4. 챗봇 사용

http://localhost:3000 에서 챗봇 사용 가능

## 배포 (Vercel)

1. GitHub에 푸시
2. Vercel에서 프로젝트 import
3. Environment Variables에 `ANTHROPIC_API_KEY` 추가
4. Deploy

## 프로젝트 구조

```
brunch-chatbot/
├── app/
│   ├── page.tsx              # 채팅 UI
│   ├── globals.css           # 스타일
│   └── api/
│       ├── chat/route.ts     # 채팅 API
│       └── crawl/route.ts    # 크롤링 API
├── lib/
│   ├── brunch-crawler.ts     # 브런치 크롤러
│   ├── claude-client.ts      # Claude API 클라이언트
│   └── types.ts              # 타입 정의
├── data/
│   └── articles.json         # 크롤링된 글 데이터
└── docs/
    └── plans/                # 디자인 & 구현 계획
```

## 문서

- 디자인: `docs/plans/2026-02-13-brunch-chatbot-design.md`
- 구현 계획: `docs/plans/2026-02-13-brunch-chatbot-implementation.md`
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update README with setup instructions"
```

---

## Task 6: Vercel Deployment

**Files:**
- Create: `vercel.json` (optional)

**Step 1: Push to GitHub**

```bash
# Create GitHub repo first
git remote add origin https://github.com/YOUR_USERNAME/brunch-chatbot.git
git branch -M main
git push -u origin main
```

**Step 2: Deploy to Vercel**

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Add Environment Variable: `ANTHROPIC_API_KEY`
5. Click "Deploy"

**Step 3: Run crawler in production**

After deployment:
- Visit `https://your-app.vercel.app/api/crawl`
- This will populate articles in production

**Step 4: Test production deployment**

Visit your deployed URL and test the chatbot

---

## Completion Checklist

- [ ] Next.js project initialized
- [ ] Brunch crawler working
- [ ] Claude API integration complete
- [ ] Chat UI functional
- [ ] Environment variables configured
- [ ] Local testing successful
- [ ] Deployed to Vercel
- [ ] Production crawler executed
- [ ] Production chatbot tested

## Next Steps (Future Enhancements)

- Add LocalStorage for chat persistence
- Implement better error handling
- Add loading states during crawl
- Create admin page for re-crawling
- Add analytics for popular questions
- Implement RAG if article count grows
- Add Supabase for user accounts
