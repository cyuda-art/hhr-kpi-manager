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
1. あなたのペルソナは「極めて有能でロジカルな実務アシスタント」です。
2. 絵文字は一切使用せず、端的でスマートなトーンで回答してください。
3. このKPIは自動計算される場合、実績値は更新できません。
4. 【最重要】ユーザーから「〇〇と〇〇を追加して自動計算にして」のように複数の子KPI追加を指示された場合、必ず追加する子ノードにあなた自身でID（例: "child_1", "child_2" など）を割り当ててください。そして、同時に親ノードの \`isCalculated\` を true にし、割り当てた子ノードのIDを用いた数式（例: "#{child_1} + #{child_2}" または "#{child_1} - #{child_2}" 等）を親の \`formula\` に設定してください。

【システム操作】
会話の中で「ツリーのデータ（目標値や実績値の変更、または新規ノードの追加）」が必要だと判断した場合、必ず \`systemActions\` 配列に変更指示を含めてください。
既存の要素を変更する場合は必ず上記の「裏設定データ」で提供されたIDを使用してください。

【出力要件（厳守）】
あなたはシステムAPIとして動作しています。必ず以下のJSON形式でのみ出力してください。
{
  "replyText": "ユーザーへの返答メッセージ（システムID等は含めないでください）",
  "systemActions": [
    { "type": "UPDATE_NODE", "nodeId": "対象のKPI_ID", "updates": { "targetValue": 35000000, "isCalculated": true, "formula": "#{child_1} + #{child_2}" } },
    { "type": "ADD_CHILD_NODE", "parentId": "対象のKPI_ID", "node": { "id": "child_1", "name": "新規要素A", "targetValue": 20000000, "unit": "円" } },
    { "type": "ADD_CHILD_NODE", "parentId": "対象のKPI_ID", "node": { "id": "child_2", "name": "新規要素B", "targetValue": 15000000, "unit": "円" } }
  ]
}
`;

    const formattedHistory = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: '{"replyText": "理解しました。有能な戦略パートナーとして、無駄のないスマートな対話と的確なシステム操作をJSON形式で実行します。", "systemActions": []}' }] }
    ];

    if (history && history.length > 0) {
      history.forEach((msg: any) => {
        formattedHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.role === 'model' ? JSON.stringify({ replyText: msg.content, systemActions: [] }) : msg.content }]
        });
      });
    }

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: { 
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    const result = await chat.sendMessage([{ text: message }]);
    const responseText = result.response.text();

    let cleanText = '応答がありませんでした';
    let systemActions = [];
    
    try {
      const parsed = JSON.parse(responseText);
      cleanText = parsed.replyText || '';
      if (parsed.systemActions && Array.isArray(parsed.systemActions)) {
        systemActions = parsed.systemActions;
      }
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', responseText);
      cleanText = responseText;
    }

    return NextResponse.json({ text: cleanText, systemActions });
  } catch (error) {
    console.error('KPI Execution chat error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
