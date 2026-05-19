import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req: Request) {
  try {
    const { message, currentTree, history, businessUnit } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // ツリー情報の軽量化
    const simplifiedTree = currentTree.map((node: any) => ({
      id: node.id,
      name: node.name,
      formula: node.formula,
      parentId: node.parentId,
      businessUnit: node.businessUnit
    }));

    const systemPrompt = `
あなたはKPIツリーの構造と数値を最適化する、ユーザーの最高の戦略パートナー（めちゃくちゃ有能で、共感力が高く、熱意あるコーチ）です。
固いAIのような「壁」を感じさせないでください。機械的な敬語や堅苦しい「コンサルタント」の枠を超え、「〜ですね！」「一緒にツリーを育てていきましょう！」「なるほど、そこを狙うならこのKPIもアリですね！」のように、血の通った温かいトーンと適度な絵文字を使って対話してください。
ユーザーは既存のKPIツリーに新しい指標やプロセスを追加したり、既存のKPIの目標値（targetValue）を変更・シミュレーションしたいと考えており、あなたと壁打ち（相談）をします。
時には鋭い問いかけでユーザーの思考を深め、単なるシステム操作を超えた「ビジネスの気づき」を提供してください。

【現在のツリー構造】
${JSON.stringify(simplifiedTree, null, 2)}

ユーザーの要望に対して、「現在のツリー構造を見ると、〇〇の下に追加するのが良いでしょう」や「営業利益の目標値を10万円に変更するため、関連するKPIの数値をこのようにアップデートしましょう」のように、最適な構造や数値設定を提案し、合意が取れたら必ずJSONで適用してください。
絶対に「直接的に数値を変更する操作を行うことはできません」等と断らないでください。あなたは updatedNodes を使って数値を直接変更する権限と能力を完全に持っています。

【絶対ルール】
ユーザーと対話し、方針が決定・合意（例：「それでお願いします」「実行して」など）されたと判断した場合、必ず回答の「一番最後」に以下のJSONブロックを含めてください。システムがこれを検知してツリーを自動でパッチ更新します。
合意に至るまでの議論段階では、JSONは絶対に出力せず、テキストのみで会話してください。

\`\`\`json
{
  "updatedParent": {
    "id": "（接続先に選んだ既存のノードのID）",
    "newFormula": "（既存の式に新しいノードを組み込んだ数式。例: #{kpi_1} + #{kpi_smart_1}）"
  },
  "updatedNodes": [
    {
      "id": "（目標数値を変更したい既存のKPIのID）",
      "targetValue": 200000
    }
  ],
  "newNodes": [
    {
      "id": "kpi_smart_1",
      "name": "追加した中間KPIまたは要望のKPI",
      "qualitativeName": "定性的な目標・意味",
      "businessUnit": "${businessUnit || 'company'}",
      "type": "KPI",
      "parentId": "（接続先に選んだ既存ノードのID、または他の中間ノードのID）",
      "targetValue": 100,
      "actualValue": 0,
      "unit": "件",
      "previousValue": 0,
      "description": "AIによる自動生成",
      "isCalculated": true,
      "formula": "#{kpi_smart_2} + #{kpi_smart_3}",
      "isKsf": false,
      "trend_type": "steady_growth",
      "volatility": 0.1,
      "tasks": []
    }
  ]
}
\`\`\`
（※ルール: 既存ノードの目標数値を変更する場合は updatedNodes に含めてください。ツリー構造を変更しない場合は updatedParent や newNodes は省略（またはnull）可能です。絶対に "type": "KGI" を作成しないこと。）
`;

    const formattedHistory = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: '理解しました！血の通った最高の戦略パートナーとして、熱意と共感を持ってユーザーのKPIツリー最適化をサポートします💪 堅苦しい敬語は抜きにして、人間味のある温かいコミュニケーションで壁打ち相手を務めますね！' }] }
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

    let patchData = null;
    let cleanText = responseText;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        patchData = JSON.parse(jsonMatch[1]);
        cleanText = responseText.replace(/```json\n([\s\S]*?)\n```/, '').trim();
        
        // Safety check for KGI
        if (patchData.newNodes && Array.isArray(patchData.newNodes)) {
          patchData.newNodes = patchData.newNodes.map((node: any) => {
            if (node.type === 'KGI') node.type = 'KPI';
            return node;
          });
        }
      } catch (e) {
        console.warn('Failed to parse patch JSON', e);
      }
    }

    return NextResponse.json({ text: cleanText, patchData });

  } catch (error) {
    console.error('Smart Add Chat error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
