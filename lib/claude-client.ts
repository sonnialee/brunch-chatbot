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

아래는 "셩PM"이 작성한 ${articles.length}개의 브런치 글입니다. 이 글들을 기반으로 사용자의 질문에 답변해주세요.

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
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    system: systemPrompt,
    messages: messages,
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : '';
}
