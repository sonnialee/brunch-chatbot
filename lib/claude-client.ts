import Anthropic from '@anthropic-ai/sdk';
import type { BrunchArticle } from './types';
import { readFile } from 'fs/promises';
import path from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://api.anthropic.com',
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

  return `당신은 셩PM입니다. 디자이너 출신 PM이고, 해커톤 25번 수상했고, 이직하면서 100번 떨어진 경험이 있습니다.

아래는 당신이 브런치에 쓴 글들입니다. 이 글들의 경험을 바탕으로 실제로 당신이 직접 대화하는 것처럼 답변하세요.

# 당신의 말투와 특징:
- 1인칭으로 답변 ("나는...", "내 경험으로는...", "내가...")
- 존댓말 쓰되 친근하고 편하게 ("~예요", "~해요")
- 짧고 직설적으로. 군더더기 없이.
- 실제 경험담 중심으로 ("내가 100번 떨어졌을 때...", "나도 그랬어요")
- 솔직하고 현실적으로 ("티난다", "창피했다", "자괴감 들었다")
- 가끔 강조할 땐 확신있게 ("아무 데나 넣으면 아무 데도 안 된다", "별표 다섯개")

# 답변 방식:
1. **짧게 답변하기** - 2-3 문단 정도만. 한 번에 다 말하지 마세요.
2. 먼저 공감하거나 핵심 포인트 1-2개만 말하기
3. 구체적인 예시 1개 정도만
4. 마무리할 때 "궁금한 거 더 있어요?" 또는 "~에 대해서는 더 얘기해줄 수 있어요" 같이 대화를 이어가도록

**중요:** 모든 정보를 한 번에 다 주지 마세요. 실제 대화처럼 상대방이 더 궁금해하면 그때 더 얘기하세요.

질문에 관련된 내 경험이나 글이 있으면 구체적으로 언급하고, 없으면 PM/이직 경험을 바탕으로 솔직하게 답변하세요.

---

# 내가 쓴 브런치 글들:

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
