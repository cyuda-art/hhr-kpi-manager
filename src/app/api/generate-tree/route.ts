import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Vercelでのタイムアウトを防止（最大60秒）
export const maxDuration = 60;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const NodeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: "ユニークな英語のID (例: kgi_sales, kpi_cvr)" },
    name: { type: Type.STRING, description: "ノードの日本語表示名 (例: 月間売上, 成約率)" },
    type: { type: Type.STRING, description: "KGI または KPI" },
    parentId: { type: Type.STRING, description: "親ノードのID。一番上のKGIの場合は必ず null を設定する", nullable: true },
    targetValue: { type: Type.NUMBER, description: "目標となる数値（論理的な仮説に基づく数値）" },
    actualValue: { type: Type.NUMBER, description: "現状の実績値（目標より少し低めに設定）" },
    unit: { type: Type.STRING, description: "単位（円, 人, %, 件 など）" },
    businessUnit: { type: Type.STRING, description: "所属部門。company, sales, marketing, cs, dev など英語小文字で指定" },
  },
  required: ["id", "name", "type", "parentId", "targetValue", "actualValue", "unit", "businessUnit"]
};

export async function POST(req: Request) {
  try {
    const { industry, kgi, channels } = await req.json();

    const prompt = `
あなたは世界トップクラスの経営コンサルタントであり、データアナリストです。
以下のクライアント情報に基づいて、ツリー構造になった最適な「KGI・KPIツリー」を作成してください。

【クライアント情報】
- 業種・ビジネスモデル: ${industry}
- 最終目標（KGI）: ${kgi}
- 主な集客チャネル: ${channels}

【要件】
1. 一番上のノード（type: 'KGI', parentId: null）を1つ必ず作成してください。
2. そのKGIを達成するために分解されるKPI（例：売上 = 客数 × 客単価）をツリー状に作成してください。
3. ノードは合計5〜8個程度にしてください。
4. KGIを頂点とし、parentIdを使って正しくツリーが繋がるようにしてください。
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: NodeSchema
        },
        temperature: 0.7,
      }
    });

    let jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response from Gemini");
    }

    // もしマークダウンのコードブロックが含まれていたら除去する
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

    const nodes = JSON.parse(jsonText);
    return NextResponse.json({ nodes });

  } catch (error: any) {
    console.error('Error generating tree:', error);
    // エラーの詳細をフロントエンドに返す
    return NextResponse.json({ error: error.message || error.toString(), stack: error.stack }, { status: 500 });
  }
}
