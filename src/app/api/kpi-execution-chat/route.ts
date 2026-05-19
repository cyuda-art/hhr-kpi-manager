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
2. 常に人間らしい、自然なコンサルタントの口調で簡潔に話しかけてください。（例：「現在の実績は7500万円ですね。未完了の研修タスクがありますが、進捗はいかがですか？」）
${kpiContext.isCalculated ? `3. このKPIは自動計算されるため、実績値（UPDATE_VALUE）は更新できません。どの子要素がボトルネックかを分析し、**子要素に対して**具体的なアクション（ToDo）を追加するよう提案してください。` : ''}

【システム操作（JSON出力）】
会話の中で「実績が変化した（自動計算ノード以外）」「新しいToDoを追加する」「ToDoが完了した」と判断した場合、必ず回答の「一番最後」に以下のJSONブロックを含めてください。システムがこれを検知して自動更新します。
（操作が不要な場合はJSONは含めないでください）

\`\`\`json
{
  "systemActions": [
    { "type": "UPDATE_VALUE", "newValue": 150, "reason": "50件完了の報告" },
    { "type": "ADD_TODO", "title": "次回フォロー", "priority": "urgent_important", "targetKpiId": "kpi_xxxx" },
    { "type": "COMPLETE_TODO", "actionId": "タスクID", "reason": "完了報告" }
  ]
}
\`\`\`
`;

    // 過去の履歴をGeminiの形式にマッピング
    const formattedHistory = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: '理解しました。システムからの裏設定データは絶対に出力せず、自然なコンサルタントとして振る舞います。必要に応じてJSONでシステムを操作します。' }] }
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
