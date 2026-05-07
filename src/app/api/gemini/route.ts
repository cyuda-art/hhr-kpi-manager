import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const { kpiData } = await req.json();

    if (!kpiData) {
      return NextResponse.json({ error: 'Missing KPI data in request body.' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
あなたはプロフェッショナルな経営コンサルタントです。
以下のKPIデータに基づいて、現在の課題（issue）、目標達成のための定性的な成功要因（ksfIdea）、そしてそのKSFを定量的に測定するための下位KPI（kpiIdea）を提案してください。アクションプランの提案は不要です。
出力は必ず以下の形式の有効なJSONとしてください。他の文章やMarkdownのバッククォートを含めないでください。

{
  "issue": "課題の要約（簡潔に）",
  "ksfIdea": "目標達成に不可欠な定性的な重要成功要因（KSF）の名称",
  "ksfReason": "なぜこのKSFが重要なのかの理由",
  "kpiIdea": "そのKSFの達成度を測るための定量的なKPIの名称",
  "kpiIdeaTarget": 1000,
  "kpiIdeaUnit": "件"
}

※ kpiIdeaTarget は数値のみを返してください。kpiIdeaUnit は単位（例：件、円、%、回など）を返してください。目標値は親KPIの数値を考慮して現実的な数値を提案してください。

[KPIデータ]
名称: ${kpiData.name}
所属事業部: ${kpiData.businessUnit}
目標値: ${kpiData.targetValue}${kpiData.unit}
実績値: ${kpiData.actualValue}${kpiData.unit}
達成率: ${((kpiData.actualValue / kpiData.targetValue) * 100).toFixed(1)}%
これまでの値: ${kpiData.previousValue}${kpiData.unit}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Markdownのバッククォートがついてしまった場合の除去
    const cleanJsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const insightData = JSON.parse(cleanJsonText);

    return NextResponse.json(insightData);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to generate insights.' }, { status: 500 });
  }
}
