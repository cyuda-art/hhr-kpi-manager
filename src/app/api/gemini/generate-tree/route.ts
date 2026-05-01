import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const { businessDescription } = await req.json();

    if (!businessDescription) {
      return NextResponse.json({ error: '事業内容が入力されていません。' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
あなたはプロフェッショナルな経営コンサルタントです。
以下の「事業内容や目標」のテキストを分析し、KPIツリー構造をJSON形式で生成してください。
ビジネスの成功に必要なKGI（最上位の目標）と、それを構成するKPIを階層構造で出力します。

ルール：
1. 出力は必ず有効なJSONのみとしてください（Markdownのバッククォートなどは含めない）。
2. JSONは以下のTypeScriptの型に従う配列形式とします。

type KpiNodeData = {
  id: string; // 例: "kgi_1", "kpi_1_1" などユニークなID
  name: string; // 指標名（例：全社売上、客室稼働率など）
  businessUnit: string; // 部門名（例：company, hotel, spa, salesなど英単語）
  type: "KGI" | "KPI";
  parentId: string | null; // ルートKGIの場合はnull、それ以外は親のid
  targetValue: number; // 目標値
  actualValue: number; // 実績値（目標より少し低めに設定）
  unit: string; // 単位（"円", "人", "%", "件"など）
  previousValue: number; // 前期実績値
  description: string; // 指標の説明
}

3. ノードは最低でも5個、最大でも15個程度にしてください。
4. KGIを頂点とし、それを因数分解したKPIをツリー状に繋げてください（parentIdで指定）。

[ユーザーの事業内容・目標]
${businessDescription}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Markdownのバッククォートがついてしまった場合の除去
    const cleanJsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const kpiNodes = JSON.parse(cleanJsonText);

    return NextResponse.json({ nodes: kpiNodes });
  } catch (error: any) {
    console.error("Gemini Tree Generation API Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to generate KPI tree.' }, { status: 500 });
  }
}
