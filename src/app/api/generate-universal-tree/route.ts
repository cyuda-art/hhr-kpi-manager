import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req: Request) {
  try {
    const { collectedData } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
あなたは、ユーザーからヒヤリングした7つの情報をもとに、KPIツリー（階層構造のJSON配列）を構築するエキスパートです。

【ヒヤリング結果】
1. VISION（究極の目的）: ${collectedData.vision}
2. MISSION（価値観・使命）: ${collectedData.mission}
3. MANIFESTO（作戦）: ${collectedData.manifesto}
4. GOAL（定性ゴール）: ${collectedData.goal}
5. KGI（定量目標）: ${collectedData.kgi}
6. KSF（重要成功要因）: ${collectedData.ksf}
7. KPI（行動指標）: ${collectedData.kpi}

【構築の絶対ルール】
ツリーは以下の順序で親子関係（parentId）を繋いだノードの配列として出力してください。

■ 定性階層（計算や数値を持たない階層）
1. VISION (id: "node_vision", parentId: null, type: "VISION")
2. MISSION (id: "node_mission", parentId: "node_vision", type: "MISSION")
3. MANIFESTO (id: "node_manifesto", parentId: "node_mission", type: "MANIFESTO")
4. GOAL (id: "node_goal", parentId: "node_manifesto", type: "GOAL")
※ 定性階層は targetValue=0, actualValue=0, isCalculated=false, formula="" としてください。

■ 定量階層（数式を用いた計算階層）
5. KGI (id: "node_kgi", parentId: "node_goal", type: "KGI")
   - targetValue: 妥当な数値を推測して設定
   - isCalculated: true
   - formula: 直下の子ノード（KSF）を足し合わせる、または掛け合わせる式（例: "#{node_ksf1} + #{node_ksf2}"）
6. KSF（複数作成可。親は "node_kgi"、type: "KSF"）
   - isCalculated: true
   - formula: 直下のKPIを用いた式
7. KPI（複数作成。親は対応するKSF、type: "KPI"）
   - isCalculated: false
   - formula: ""

【出力要件】
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

    // JSON配列を返す
    return NextResponse.json({ nodes: data.nodes });

  } catch (error: any) {
    console.error('Failed to generate universal tree:', error);
    return NextResponse.json({ error: error?.message || 'Failed to process' }, { status: 500 });
  }
}
