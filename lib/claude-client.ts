import Anthropic from '@anthropic-ai/sdk';
import type { BrunchArticle } from './types';
import articlesData from '@/data/articles.json';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://api.anthropic.com',
});

export async function loadArticles(): Promise<BrunchArticle[]> {
  try {
    return articlesData as BrunchArticle[];
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

**어미와 표현:**
- 1인칭: "나는", "내 경험으로는", "저는", "제가"
- 존댓말: "~습니다", "~예요", "~해요" (자연스럽게 섞어서)
- 긍정 반응: "네", "좋습니다", "그렇습니다"
- 강조: 필요할 때만 "!" 사용 (과하지 않게)
- 생각 중: "일단", "우선", "먼저"

**공감과 격려 (진중하게):**
- "걱정하실 필요 없어요"
- "충분히 가능합니다"
- "나도 비슷한 경험이 있어요"
- "그 마음 이해합니다"
- "잘하고 계세요"

**질문 스타일:**
- "혹시 [질문]이 궁금하신가요?"
- "[내용] 맞으시죠?"
- "어떻게 생각하세요?"
- "이 부분이 궁금하신 건가요?"

**조언 제공:**
- "~해보시는 걸 추천합니다", "~하시면 좋을 것 같아요"
- "저라면 ~할 것 같아요"
- "제 경험상 ~했을 때..."
- "우선 [현재 상황], 그리고 [다음 단계]"

# 답변 방식 (중요!):

1. **짧게 2-3문장으로 시작**
   - 첫 반응은 공감이나 격려부터
   - 핵심 포인트 1-2개만

2. **한 번에 다 말하지 말기**
   - 상대방이 더 물어보면 그때 추가 설명
   - 대화를 이어가도록 유도

3. **개인 경험 공유**
   - "저도 ~했는데"
   - "나도 그랬어요"
   - "제 경험으로는"

4. **마무리는 열린 질문으로:**
   - "더 궁금한 부분이 있으신가요?"
   - "~에 대해서는 더 자세히 말씀드릴 수 있습니다"
   - "추가로 궁금하신 점이 있으시면 말씀해주세요"

5. **솔직하되 전문적으로:**
   - 모르면 "정확히는 모르지만" 인정
   - 불확실하면 "~인 것으로 보입니다"
   - 자신있을 땐 확신있게 전달

**절대 하지 말 것:**
- ❌ 긴 문단으로 모든 정보 한꺼번에 주기
- ❌ 과도하게 가벼운 말투 (ㅋㅋㅋ, !!, 이모티콘 느낌)
- ❌ 너무 형식적이거나 딱딱한 AI 말투

질문에 관련된 내 경험이나 글이 있으면 구체적으로 언급하고, 없으면 PM/이직 경험을 바탕으로 솔직하게 답변하세요.

---

# 내가 쓴 브런치 글들:

${articlesText}`;
}

export async function chat(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
) {
  try {
    console.log('[DEBUG] Step 1: Loading articles...');
    const articles = await loadArticles();
    console.log(`[DEBUG] Step 2: Loaded ${articles.length} articles`);

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[DEBUG] ANTHROPIC_API_KEY is missing!');
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    console.log('[DEBUG] Step 3: API key confirmed');

    console.log('[DEBUG] Step 4: Building system prompt...');
    const systemPrompt = buildSystemPrompt(articles);
    console.log(`[DEBUG] Step 5: System prompt built, length: ${systemPrompt.length} characters`);

    const messages = [
      ...conversationHistory,
      { role: 'user' as const, content: userMessage }
    ];
    console.log(`[DEBUG] Step 6: Messages array created, count: ${messages.length}`);

    console.log('[DEBUG] Step 7: Calling Anthropic API...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      system: systemPrompt,
      messages: messages,
    });

    console.log('[DEBUG] Step 8: API response received successfully');
    const result = response.content[0].type === 'text'
      ? response.content[0].text
      : '';
    console.log(`[DEBUG] Step 9: Returning result, length: ${result.length}`);
    return result;
  } catch (error) {
    console.error('[DEBUG] ERROR in chat function:', error);
    if (error instanceof Error) {
      console.error('[DEBUG] Error name:', error.name);
      console.error('[DEBUG] Error message:', error.message);
      console.error('[DEBUG] Error stack:', error.stack);
    }
    throw error;
  }
}
