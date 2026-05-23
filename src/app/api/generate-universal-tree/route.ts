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
あなたは、ユーザーからヒヤリングした「意志（情熱）」をもとに、完全なKPIツリー（階層構造のJSON配列）を全自動で推論・構築するエキスパートコンサルタントです。

【ユーザーとの対話で決定した「意志（情熱）」】
1. VISION (究極の目的): ${collectedData.vision || '未定義'}
2. GOAL (目指す状態): ${collectedData.goal || '未定義'}
3. KGI (定量目標): ${collectedData.kgi || '未定義'}

【あなたのタスク：完全自動展開】
上記3つの「人間の意志」をコアとして、不足している「MISSION」「MANIFESTO」「KSF」「KPI」を、あなたの圧倒的な論理力と推論能力で補完し、全7階層のツリーを構築してください。
ツリーは以下の順序で親子関係（parentId）を繋いだノードの配列として出力してください。

■ 定性階層（計算や数値を持たない階層）
1. VISION (id: "node_vision", parentId: null, type: "VISION")
   - 上記の「VISION」を要約してセット。
2. MISSION (id: "node_mission", parentId: "node_vision", type: "MISSION")
   - 【AIによる自動生成】VISIONを達成するための使命や価値観を推論。
3. MANIFESTO (id: "node_manifesto", parentId: "node_mission", type: "MANIFESTO")
   - 【AIによる自動生成】現状を打破するための具体的な作戦・方針を推論。
4. GOAL (id: "node_goal", parentId: "node_manifesto", type: "GOAL")
   - 上記の「GOAL」を要約してセット。
※ 定性階層は targetValue=0, actualValue=0, isCalculated=false, formula="", unit="" としてください。

■ 定量階層（数式を用いた計算階層）
5. KGI (id: "node_kgi", parentId: "node_goal", type: "KGI")
   - targetValue: KGIの文字列から妥当な数値を推測して設定（例: "売上100万"なら1000000）
   - unit: 適切な単位（例: "円", "kg", "人"）
   - isCalculated: true
   - formula: 直下の子ノード（KSF）を足し合わせる、または掛け合わせる式（例: "#{node_ksf1} + #{node_ksf2}"）
6. KSF（複数作成。親は "node_kgi"、type: "KSF"）
   - 例: "node_ksf1", "node_ksf2"
   - isCalculated: true
   - formula: 直下のKPIを用いた式
7. KPI（各KSFにつき1〜2個。親は対応するKSF、type: "KPI"）
   - 例: "node_kpi1", "node_kpi2"
   - isCalculated: false
   - formula: ""

【出力要件】
- \`qualitativeName\` には、ヒヤリング内容を反映した具体的な内容を入れてください。
- 純粋なJSONオブジェクトのみを出力してください（マークダウンの \`\`\`json 等は不要）。
- 出力は必ず以下の形式の { "nodes": [...] } オブジェクトとしてください。

{
  "nodes": [
    {
      "id": "node_vision",
      "name": "VISION",
      "qualitativeName": "...",
      "type": "VISION",
      "parentId": null,
      "targetValue": 0,
      "actualValue": 0,
      "unit": "",
      "isCalculated": false,
      "formula": ""
    },
    ... (他のノードも同様に定義)
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
