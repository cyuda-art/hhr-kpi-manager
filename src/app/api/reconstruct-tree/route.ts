import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  // Gemini API 初期化 (Vercelデプロイ互換)
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || 'dummy_key',
  });
  try {
    const { prompt: userPrompt, kpiData, manifesto, swot, crossSwot } = await req.json();

    const systemPrompt = `あなたは戦略コンサルタント兼KPIアーキテクトです。
現在、ユーザーは以下の「戦略マニフェスト」と「SWOT分析」に基づいて構成されたKPIツリーを運用しています。

【戦略マニフェスト】
${manifesto || '未設定'}

【SWOT & Cross-SWOT】
${swot || '未設定'}
${crossSwot || '未設定'}

ユーザーから指示を受けます。現在のKPIツリーデータを再構築（ノード追加・削除・変更・数式定義）し、**新しいkpiDataの完全なJSON**を返却してください。

【現在のkpiData】
${JSON.stringify(kpiData, null, 2)}

【ユーザーの指示】
${userPrompt}

【出力要件】
1. ユーザー指示の意図を汲み取り、ツリーの論理構造（KGI -> KSF -> KPI -> Process）が破綻しないこと。
2. ツリーは必ず親ノード（parentId）と子ノードを持つDAGであること。
3. 1つの親に対して1つの子しか持たない（1対1の紐付け）状態は計算式が無意味なため絶対に避けること。
4. 計算式（formula）がある場合は、依存関係（#{nodeId}）が正しく機能するようにすること。（名前にせずIDを使う）
5. 出力は、書き換え後の \`kpiData\` オブジェクトのみを格納した厳密なJSON形式で出力すること。`;

    // Gemini 1.5 Flashによる高速推論
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty response from Vertex AI");
    
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
