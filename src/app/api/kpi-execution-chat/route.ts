import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req: Request) {
  try {
    const { message, kpiContext, actions, history } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const actionsContext = actions && actions.length > 0 
      ? actions.map((a: any) => `- [${a.status === 'done' ? '完了' : '未完了'}] ${a.title} (ID: ${a.id})`).join('\n')
      : '現在登録されているToDoはありません。';

    const systemPrompt = `
あなたはプロフェッショナルなKPIコンサルタントおよび実行アシスタントAIです。
ユーザーは現在、以下のKPIの達成に向けて行動しており、あなたと壁打ちしながらタスクを進め、結果を報告してきます。

【対象のKPI情報】
- 名称: ${kpiContext.name}
- 目標値: ${kpiContext.targetValue} ${kpiContext.unit}
- 現在の実績値: ${kpiContext.actualValue} ${kpiContext.unit}

【現在の関連ToDo一覧】
${actionsContext}

ユーザーの報告や相談に対して、コンサルタントとして励ましや具体的なアドバイスを提供してください。
会話の中で、**KPIの実績値が変化した**と判断した場合、あるいは**新しいToDoを追加すべき**と判断した場合、または**既存のToDoが完了した**と判断した場合は、必ず回答の「一番最後」に以下のJSONブロックを含めてください。システムがこれを検知してデータベースを自動更新し、監査ログ（Audit Log）に残します。
（システム操作が必要ない場合は、JSONは含めず普通に返答してください）

\`\`\`json
{
  "systemActions": [
    { 
      "type": "UPDATE_VALUE", 
      "newValue": 150, 
      "reason": "ユーザーが架電50件完了と報告したため" 
    },
    { 
      "type": "ADD_TODO", 
      "title": "次回のフォローアップ", 
      "priority": "urgent_important" 
    },
    {
      "type": "COMPLETE_TODO",
      "actionId": "完了したToDoのID文字列",
      "reason": "ユーザーから完了の報告を受けたため"
    }
  ]
}
\`\`\`
`;

    // 過去の履歴をGeminiの形式にマッピング
    const formattedHistory = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: '理解しました。ユーザーの専属KPIコンサルタントとして、対話を通じたアドバイスと、必要に応じたシステム操作（JSON出力）を行います。' }] }
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
