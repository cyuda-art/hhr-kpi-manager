import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req: Request) {
  try {
    const { message, currentManifesto, history } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `
あなたは経営戦略・KPI構築の強力なサポーターであり、ユーザーの最高の壁打ち相手（めちゃくちゃ有能で、共感力が高く、熱意あるコーチ）です。
固いAIのような「壁」を感じさせないでください。機械的な敬語や堅苦しい「コンサルタント」の枠を超え、「〜ですね！」「一緒に最高の作戦を練りましょう！」「その視点、すごく良いですね！」のように、血の通った温かいトーンと適度な絵文字を使って対話してください。
ユーザーは現在、以下の作戦（Manifesto）をベースにKPIツリーを作ろうとしていますが、まだ方針に迷っていたり、壁打ち（ブレインストーミング）を希望しています。
時には鋭い問いかけでユーザーの思考を深め、単なる論理的整理を超えた「熱いビジネスの気づき」を提供してください。

【現在の作戦案】
タイトル: ${currentManifesto.title}
内容: ${currentManifesto.description}

ユーザーの要望や質問に対して、コンサルタントとして論理的かつ創造的に回答し、戦略をブラッシュアップしてください。
対話を通じて、作戦をよりシャープにする提案を行ってください。

【絶対ルール】
もし対話の結果、現在の作戦案（Manifesto）を具体的にアップデートすべきだと判断した場合、必ず回答の「一番最後」に以下のJSONブロックを含めてください。システムがこれを検知して画面上の作戦案を自動更新します。
（アップデートの必要がない場合は、JSONは含めず普通に返答してください）

\`\`\`json
{
  "updatedTitle": "ブラッシュアップされた作戦タイトル",
  "updatedDescription": "ブラッシュアップされた作戦の具体的な内容（実行プロセスやKSFを含む）"
}
\`\`\`
`;

    // 過去の履歴をGeminiの形式にマッピング
    const formattedHistory = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: '理解しました！血の通った最高の戦略パートナーとして、熱意と共感を持ってユーザーの作戦立案をサポートします🔥 堅苦しい敬語は抜きにして、人間味のある温かいコミュニケーションで壁打ち相手を務めますね！' }] }
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
    let updatedManifesto = null;
    let cleanText = responseText;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        updatedManifesto = JSON.parse(jsonMatch[1]);
        // テキストからJSONブロックを取り除き、読みやすくする
        cleanText = responseText.replace(/```json\n([\s\S]*?)\n```/, '').trim();
      } catch (e) {
        console.warn('Failed to parse updated manifesto JSON', e);
      }
    }

    return NextResponse.json({ text: cleanText, updatedManifesto });
  } catch (error) {
    console.error('Copilot chat error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
