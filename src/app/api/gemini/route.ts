import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const { kpiData, allKpiData, projectInfo } = await req.json();

    if (!kpiData) {
      return NextResponse.json({ error: 'Missing KPI data in request body.' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // 全体のKPIツリー構造を文字列化（階層などの情報を付与）
    let allKpiContext = "";
    if (allKpiData) {
      const nodes = Object.values(allKpiData) as any[];
      allKpiContext = nodes.map(node => {
        return `- ${node.type}: ${node.qualitativeName || '(定性名称なし)'} / ${node.name} (事業部: ${node.businessUnit}, 目標: ${node.targetValue}${node.unit}, 実績: ${node.actualValue}${node.unit})`;
      }).join('\\n');
    }

    // 事業概要を文字列化
    let projectContext = "特に指定されていません";
    if (projectInfo) {
      projectContext = `
・プロジェクト名: ${projectInfo.name || '未設定'}
・ビジネスモデル/ターゲット層: ${projectInfo.businessModel || '未設定'}
・事業概要/特記事項: ${projectInfo.description || '未設定'}
      `.trim();
    }

    const prompt = `
あなたはプロフェッショナルな経営コンサルタントです。
以下の「プロジェクト事業内容」「全体のKPIツリー構造」と「今回選択されたKPIデータ」を加味して、現在の課題（issue）、目標達成のための定性的な成功要因（ksfIdea）、そしてそのKSFを定量的に測定するための下位KPI（kpiIdea）を提案してください。
必ず事業全体の文脈や上位KGI・Goalの達成につながるような、本質的なKSFとKPIを提示してください。アクションプランの提案は不要です。

出力は必ず以下の形式の有効なJSONとしてください。他の文章やMarkdownのバッククォートを含めないでください。

{
  "issue": "課題の要約（簡潔に）",
  "ksfIdea": "目標達成に不可欠な定性的な重要成功要因（KSF）の名称",
  "ksfReason": "なぜこのKSFが重要なのか、全体の事業内容や上位KGIとどうリンクしているかの理由",
  "kpiIdea": "そのKSFの達成度を測るための定量的なKPIの名称",
  "kpiIdeaTarget": 1000,
  "kpiIdeaUnit": "件"
}

※ kpiIdeaTarget は数値のみを返してください。kpiIdeaUnit は単位（例：件、円、%、回など）を返してください。目標値は全体のバランスや親KPIの数値を考慮して現実的な数値を提案してください。

【プロジェクト事業内容】
${projectContext}

【プロジェクト全体のKPIツリー・構造】
${allKpiContext || 'データなし'}

【今回選択されたKPIデータ（このノードに対する改善案を出してください）】
名称 (定量): ${kpiData.name}
名称 (定性): ${kpiData.qualitativeName || '未設定'}
所属事業部: ${kpiData.businessUnit}
目標値: ${kpiData.targetValue}${kpiData.unit}
実績値: ${kpiData.actualValue}${kpiData.unit}
達成率: ${((kpiData.actualValue / kpiData.targetValue) * 100).toFixed(1)}%
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
