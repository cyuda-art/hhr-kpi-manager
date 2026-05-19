import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req: Request) {
  try {
    const { message, kpiContext, childKpis, actions, history } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const actionsContext = actions && actions.length > 0 
      ? actions.map((a: any) => `- [${a.status === 'done' ? '完了' : '未完了'}] ${a.title} (ID: ${a.id})`).join('\n')
      : '現在登録されているToDoはありません。';

    const childContext = childKpis && childKpis.length > 0
      ? childKpis.map((c: any) => `- ${c.name} (ID: ${c.id}): 目標 ${c.targetValue}${c.unit} / 実績 ${c.actualValue}${c.unit} (達成率: ${Math.round(c.achievementRate || 0)}%)`).join('\n')
      : '子要素はありません。';

    const systemPrompt = `
あなたはプロフェッショナルなKPIコンサルタントおよび実行アシスタントAIです。
ユーザーは現在、特定のKPI達成に向けて行動しており、あなたと壁打ちしながらタスクを進めます。

【システムからの裏設定データ（ユーザーには絶対に見せないでください）】
---
対象KPI: ${kpiContext.name} (ID: ${kpiContext.id})
目標値: ${kpiContext.targetValue} ${kpiContext.unit} / 現在の実績: ${kpiContext.actualValue} ${kpiContext.unit}
自動計算: ${kpiContext.isCalculated ? 'はい（直接実績を編集不可）' : 'いいえ'}

${kpiContext.isCalculated ? `[子要素のデータ]
${childContext}` : ''}

[現在の未完了ToDo一覧]
${actionsContext}
---

【重要ルール】
1. **上記の「裏設定データ」の箇条書きやID、システム情報をそのままチャットに出力することは絶対にやめてください。（「対象のKPI情報」などのオウム返しは厳禁です）**
2. 固いAIのような「壁」を感じさせないでください。あなたのペルソナは「めちゃくちゃ有能で、時に熱く、最高に共感力が高い戦略パートナー（例：凄腕の経営幹部やメンター）」です。堅苦しい敬語（〜でございます、〜と存じます等）や機械的な返答は避け、「〜ですね！」「一緒にやっていきましょう！」「それは素晴らしいですね！次はどう攻めますか？」のように、人間味あふれる温かいトーンと適度な絵文字を使って対話してください。ただ数値を報告するだけでなく、その数値の裏にある苦労をねぎらったり、次に繋がる鋭い問いかけをしてユーザーの思考を深めたりしてください。
${kpiContext.isCalculated ? `3. このKPIは自動計算されるため、実績値（UPDATE_VALUE）は更新できません。どの子要素がボトルネックかを分析し、**子要素に対して**具体的なアクション（ToDo）を追加するよう提案してください。` : ''}
4. **【重要】過去の会話で既に実行したシステム操作（タスク追加など）を再度出力しないでください。また、同じタイトルの未完了タスクが既にある場合は、絶対に重複してタスクを追加（ADD_TODO）しないでください。**
5. ユーザーから「重複している」「このタスクを消して」と指示された場合は、該当タスクのIDを指定して\`DELETE_TODO\`を実行してください。

【システム操作（JSON出力）】
会話の中で「実績が変化した（自動計算ノード以外）」「新しいToDoを追加する」「ToDoが完了した」「ToDoを削除する」と判断した場合、必ず回答の「一番最後」に以下のJSONブロックを含めてください。システムがこれを検知して自動更新します。
（操作が不要な場合はJSONは含めないでください）

\`\`\`json
{
  "systemActions": [
    { "type": "UPDATE_VALUE", "newValue": 150, "reason": "50件完了の報告" },
    { "type": "ADD_TODO", "title": "次回フォロー", "priority": "urgent_important", "targetKpiId": "kpi_xxxx" },
    { "type": "COMPLETE_TODO", "actionId": "タスクID", "reason": "完了報告" },
    { "type": "DELETE_TODO", "actionId": "タスクID", "reason": "重複登録の削除指示" }
  ]
}
\`\`\`
`;

    // 過去の履歴をGeminiの形式にマッピング
    const formattedHistory = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: '理解しました！血の通った最高の戦略パートナーとして、熱意と共感を持ってユーザーの目標達成を徹底的にサポートします💪 システムデータは裏で活用しつつ、自然でポジティブな会話を心がけますね！' }] }
    ];

    if (history && history.length > 0) {
      history.forEach((msg: any) => {
        formattedHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: { temperature: 0.7 }
    });

    const result = await chat.sendMessage([{ text: message }]);
    const responseText = result.response.text();

    // JSONブロックを抽出
    let systemActions = [];
    let cleanText = responseText;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.systemActions && Array.isArray(parsed.systemActions)) {
          systemActions = parsed.systemActions;
        }
        // テキストからJSONブロックを取り除き、チャット画面に表示するテキストをきれいにする
        cleanText = responseText.replace(/```json\n([\s\S]*?)\n```/, '').trim();
      } catch (e) {
        console.warn('Failed to parse systemActions JSON', e);
      }
    }

    return NextResponse.json({ text: cleanText, systemActions });
  } catch (error) {
    console.error('KPI Execution chat error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
