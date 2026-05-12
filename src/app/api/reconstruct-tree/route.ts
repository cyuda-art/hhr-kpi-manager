import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { prompt: userPrompt, kpiData, manifesto, swot, crossSwot } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `あなたは戦略コンサルタント兼KPIアーキテクトです。
現在、ユーザーは以下の「戦略マニフェスト」と「SWOT分析」に基づいて構成されたKPIツリーを運用しています。

【戦略マニフェスト】
${manifesto || '未設定'}

【SWOT & Cross-SWOT】
${swot || '未設定'}
${crossSwot || '未設定'}

ユーザーから「もっと攻めの戦略に変えて」などの指示を受けます。
その指示に合わせて、現在のKPIツリーデータ（kpiData）を再構築（ノードの追加・削除・変更・数式の再定義）し、**新しいkpiDataの完全なJSON**を返却してください。

【現在のkpiData】
${JSON.stringify(kpiData, null, 2)}

【ユーザーの指示】
${userPrompt}

【出力要件】
1. ユーザーの指示の意図を汲み取り、ツリーの論理構造（KGI -> KSF -> KPI -> Process）が破綻しないようにしてください。
2. ツリーは必ず親ノード（parentId）と子ノードを持つDAG（有向非巡回グラフ）でなければなりません。
3. 計算式（formula）がある場合は、依存関係（#{nodeId}）が正しく機能するようにしてください。
4. 出力は、書き換え後の \`kpiData\` オブジェクトのみを格納した厳密なJSON形式（Markdownのバッククォートなし）で出力してください。

出力JSONフォーマット:
{
  "kgi_profit": { "id": "kgi_profit", "name": "...", "parentId": null, ... },
  "node_abc": { "id": "node_abc", "name": "...", "parentId": "kgi_profit", ... }
}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      }
    });

    const responseText = result.response.text();
    let newKpiData = JSON.parse(responseText);

    // もし親階層（kpiDataというキー）が含まれていたら剥がす
    if (newKpiData.kpiData) {
      newKpiData = newKpiData.kpiData;
    }

    return NextResponse.json({ kpiData: newKpiData });

  } catch (error: any) {
    console.error('Tree Reconstruction Error:', error);
    return NextResponse.json({ error: error.message || '内部サーバーエラー' }, { status: 500 });
  }
}
