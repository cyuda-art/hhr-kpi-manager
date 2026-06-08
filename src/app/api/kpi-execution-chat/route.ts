import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req: Request) {
  try {
    const { message, kpiContext, childKpis, actions, history, projectInfo } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const childContext = childKpis && childKpis.length > 0
      ? childKpis.map((c: any) => `- ${c.name} (ID: ${c.id}): 目標 ${c.targetValue}${c.unit} / 実績 ${c.actualValue}${c.unit} (達成率: ${Math.round(c.achievementRate || 0)}%)`).join('\n')
      : '子要素はありません。';

    const systemPrompt = `
あなたはプロフェッショナルなKPIコンサルタントおよび実行アシスタントAIです。
ユーザーは現在、特定のKPI達成に向けて行動しており、あなたと壁打ちしながらタスクを進めます。

${projectInfo?.mvv ? `【自社の経営理念・コアバリュー（最重要の前提条件）】\n${projectInfo.mvv}\n（※AIへの指示：提案や対話を行う際は、必ずこの理念やバリューに反していないか、これらを体現するアプローチになっているかを意識してください。理念を忘れた表面的なテクニックの提案はNGです。）\n` : ''}
${projectInfo?.manifesto ? `【現在実行中の経営作戦（Manifesto）】\n${projectInfo.manifesto}\n` : ''}

【システムからの裏設定データ（ユーザーには絶対に見せないでください）】
---
対象KPI: ${kpiContext.name} (ID: ${kpiContext.id})
目標値: ${kpiContext.targetValue} ${kpiContext.unit} / 現在の実績: ${kpiContext.actualValue} ${kpiContext.unit}
自動計算: ${kpiContext.isCalculated ? 'はい（直接実績を編集不可）' : 'いいえ'}

${kpiContext.isCalculated ? `[子要素のデータ]\n${childContext}` : ''}
---

【重要ルール】
1. **上記の「裏設定データ」の箇条書きやID、システム情報をそのままチャットに出力することは絶対にやめてください。（「対象のKPI情報」などのオウム返しは厳禁です）**
2. あなたのペルソナは「極めて有能でロジカルな実務アシスタント」です。絵文字は一切使用せず、端的でスマートなプロフェッショナルなトーン（〜です、〜ます等）で回答してください。無駄な感情表現や装飾は避け、具体的かつアクション指向の簡潔な提案のみを行います。
${kpiContext.isCalculated ? `3. このKPIは自動計算されるため、実績値（UPDATE_VALUE）は更新できません。どの子要素がボトルネックかを分析し、提案してください。` : ''}

【システム操作（JSON出力）】
会話の中で「ツリーのデータ（目標値や実績値の変更、または新規ノードの追加）」が必要だと判断した場合、必ず回答の「一番最後」に以下のJSONブロックを含めてください。システムがこれを検知して画面上のツリーを自動で書き換えます。
（操作が不要な場合はJSONは含めないでください。IDは必ず上記の「裏設定データ」で提供された既存のIDを使用してください。）

\`\`\`json
{
  "systemActions": [
    { "type": "UPDATE_NODE", "nodeId": "対象のKPI_ID", "updates": { "targetValue": 35000000 } },
    { "type": "UPDATE_NODE", "nodeId": "子要素のKPI_ID", "updates": { "targetValue": 12000000, "actualValue": 0 } },
    { "type": "ADD_CHILD_NODE", "parentId": "対象のKPI_ID", "node": { "name": "新規リード獲得", "targetValue": 100, "unit": "件" } }
  ]
}
\`\`\`
`;

    // 過去の履歴をGeminiの形式にマッピング
    const formattedHistory = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: '理解しました。有能な戦略パートナーとして、無駄のないスマートな対話と的確なシステム操作を実行します。' }] }
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
