import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// export const runtime = 'edge'; // Edgeでクラッシュ/タイムアウトする可能性を排除
export const maxDuration = 60; // Vercel Hobbyで最大60秒まで許可

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req: Request) {
  try {
    const { collectedData } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
あなたは、ユーザーからヒヤリングした「意志（情熱）」をもとに、完全な定量KPIツリー（階層構造のJSON配列）を全自動で推論・構築するエキスパートコンサルタントです。

【ユーザーとの対話で決定した「意志（情熱）」】
1. VISION (究極の目的): ${collectedData.vision || '未定義'}
2. GOAL (目指す状態): ${collectedData.goal || '未定義'}
3. KGI (定量目標): ${collectedData.kgi || '未定義'}

【あなたのタスク：定量ツリーの完全自動展開】
「ツリーの中間・上位ノードは必ず四則演算によって計算される」という絶対条件を守るため、定性ノード（VISIONやGOAL自体）はツリーのノードとして出力しないでください。
出力するツリーの最上位（ルート）は「KGI」とし、その下に「KSF」、さらに下に「KPI」が続く純粋な定量ツリーを構築してください。
ただし、KGIやKSFが何のためにあるのかを表現するため、ノードの \`qualitativeName\` に上記の定性的な情報を付与してください。

ツリーは以下の順序で親子関係（parentId）を繋いだノードの配列として出力してください。

■ 階層構造（全て数値計算可能なノード）
1. KGI (id: "node_kgi", parentId: null, type: "KGI")
   - targetValue: KGIの文字列から妥当な数値を推測して設定（例: "売上100万"なら1000000）
   - unit: 適切な単位（例: "円", "kg", "人"）
   - isCalculated: true
   - formula: 直下の子ノード（KSF）のidを用いて、KGIを算出する四則演算の式（例: "#{node_ksf1} + #{node_ksf2}"）
   - qualitativeName: 上記の「GOAL (目指す状態)」を要約してセット（ユーザーの達成したい定性的な目的を表現）。

2. KSF（複数作成。親は "node_kgi"、type: "KSF"）
   - 例: "node_ksf1", "node_ksf2"
   - targetValue: KGIの計算式（formula）の辻褄が合うように、妥当な数値を設定。
   - isCalculated: true
   - formula: 直下のKPIのidを用いた四則演算の式。
   - qualitativeName: このKSFが意味する「定性的なアクション・成功要因」を具体的にセット。

3. KPI（各KSFにつき1〜2個。親は対応するKSF、type: "KPI"）
   - 例: "node_kpi1", "node_kpi2"
   - targetValue: KSFの計算式（formula）の辻褄が合うように、妥当な数値を設定。
   - isCalculated: false
   - formula: ""
   - qualitativeName: "" (KPIには不要)

【出力要件】
- 純粋なJSONオブジェクトのみを出力してください（マークダウンの \`\`\`json 等は不要）。
- 出力は必ず以下の形式の { "nodes": [...] } オブジェクトとしてください。

{
  "nodes": [
    {
      "id": "node_kgi",
      "name": "年間売上高",
      "qualitativeName": "業界No.1のシェアを獲得する",
      "type": "KGI",
      "parentId": null,
      "targetValue": 1000000,
      "actualValue": 0,
      "unit": "円",
      "isCalculated": true,
      "formula": "#{node_ksf1} + #{node_ksf2}"
    }
  ]
}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const textResponse = result.response.text();
    let data;
    try {
      data = JSON.parse(textResponse);
    } catch (e) {
      throw new Error(`AIの出力が不正です: ${textResponse}`);
    }

    return NextResponse.json({ nodes: data.nodes });

  } catch (error: any) {
    console.error('Failed to generate universal tree:', error);
    return NextResponse.json({ error: error?.message || 'Failed to process' }, { status: 500 });
  }
}
