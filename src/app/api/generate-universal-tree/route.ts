import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// export const runtime = 'edge'; // Edgeでクラッシュ/タイムアウトする可能性を排除
export const maxDuration = 60; // Vercel Hobbyで最大60秒まで許可

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req: Request) {
  try {
    const { userGoal } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
あなたは、ユーザーからのたった1つの要望・目標（プロンプト）から、その目標を達成するための完全なKPIツリー（階層構造のJSON配列）を最高解像度で推論・構築するエキスパートです。

【ユーザーの目標・要望】
${userGoal}

【構築の絶対ルール】
ユーザーの目標を分析し、以下の7階層（VISIONからKPIまで）を論理的に補完・展開してください。
ツリーは以下の順序で親子関係（parentId）を繋いだノードの配列として出力してください。

■ 定性階層（計算や数値を持たない階層）
1. VISION (id: "node_vision", parentId: null, type: "VISION")
   - ユーザーの目標のさらに先にある、究極の理想の姿・目的。
2. MISSION (id: "node_mission", parentId: "node_vision", type: "MISSION")
   - VISIONを達成するための使命や価値観。
3. MANIFESTO (id: "node_manifesto", parentId: "node_mission", type: "MANIFESTO")
   - 現状を打破するための具体的な作戦・方針。
4. GOAL (id: "node_goal", parentId: "node_manifesto", type: "GOAL")
   - 作戦が成功した状態を示す定性的なゴール。
※ 定性階層は targetValue=0, actualValue=0, isCalculated=false, formula="", unit="" としてください。

■ 定量階層（数式を用いた計算階層）
5. KGI (id: "node_kgi", parentId: "node_goal", type: "KGI")
   - GOALを客観的に測る最終数値目標。
   - targetValue: 妥当な数値を推測して設定（例: 売上なら1000000、体重なら-10など）
   - unit: 適切な単位（例: "円", "kg", "人"）
   - isCalculated: true
   - formula: 直下の子ノード（KSF）を足し合わせる、または掛け合わせる式（例: "#{node_ksf1} * #{node_ksf2}"）
6. KSF（複数作成。親は "node_kgi"、type: "KSF"）
   - 例: "node_ksf1", "node_ksf2"
   - isCalculated: true
   - formula: 直下のKPIを用いた式
7. KPI（各KSFにつき1〜2個。親は対応するKSF、type: "KPI"）
   - 例: "node_kpi1", "node_kpi2"
   - isCalculated: false
   - formula: ""

【出力要件】
- \`qualitativeName\` には、そのノードの具体的な内容（例：「1日2000kcalに抑える」等）を入れてください。
- 純粋なJSONオブジェクトのみを出力してください（マークダウンの \`\`\`json 等は不要）。
- 出力は必ず以下の形式の { "nodes": [...] } オブジェクトとしてください。

{
  "nodes": [
    {
      "id": "node_vision",
      "name": "究極の目的",
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
