import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { projectName, description, mvv, industry, revenueScale, currentIssues } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
あなたはプロの経営コンサルタントであり、KPIマネジメントの専門家です。
以下の企業/事業情報を元に、最適な「KGI」とそれを達成するための「KPIツリー」を構築し、指定されたJSONフォーマットで出力してください。

【企業・事業情報】
- プロジェクト名 (KGI名): ${projectName}
- プロジェクト概要: ${description || '未設定'}
- MVV (Mission, Vision, Value): ${mvv || '未設定'}
- 事業・業種: ${industry || '未設定'}
- 売上規模: ${revenueScale || '未設定'}
- 現状の課題・悩み: ${currentIssues || '未設定'}

【出力要件】
- 以下のTypeScriptインターフェースに準拠したJSON配列（KpiNodeData[]）を出力してください。
- markdownのコードブロック表記 (\`\`\`json ... \`\`\`) は絶対に含めず、純粋なJSON配列のみを出力してください。
- ノードは合計で10個〜15個程度作成してください。
- 階層構造:
  - 1つの頂点ノード (type: "KGI", parentId: null) を必ず作成し、IDは "kgi_main" としてください。
  - その他のノード (type: "KPI") は、ツリー構造になるように parentId に親ノードのIDを指定してください。
  - IDはユニークな半角英数字（例: kpi_sales, kpi_cpa_1 など）にしてください。
- businessUnitは "company", "hotel", "spa", "restaurant", "shop", "kitchen", "cross" のいずれかを指定してください。基本は "company" で構いません。
- 現状の課題（${currentIssues}）を解決するための具体的なKPIを必ずツリーの中に含めてください。
- 数値（targetValue, actualValue, previousValue）は、売上規模（${revenueScale}）から推測してリアリティのある数値を設定してください（単位に注意）。
- さらに、子を持たない末端のKPIノードには、そのKPIを達成するために現場が明日から実行すべき具体的な「タスク（ToDo）」を1〜3個程度、"tasks" 配列として付与してください。

【JSONインターフェース】
[
  {
    "id": "kgi_main",
    "name": "KGIの名前",
    "qualitativeName": "定性的な目標",
    "businessUnit": "company",
    "type": "KGI",
    "parentId": null,
    "targetValue": 100000000,
    "actualValue": 80000000,
    "unit": "円",
    "previousValue": 75000000,
    "description": "KGIの詳細説明"
  },
  {
    "id": "kpi_child_1",
    "name": "末端KPIの名前",
    "qualitativeName": "定性的な目標",
    "businessUnit": "company",
    "type": "KPI",
    "parentId": "kgi_main",
    "targetValue": 50,
    "actualValue": 0,
    "unit": "件",
    "previousValue": 0,
    "description": "KPIの詳細",
    "tasks": [
      {
        "task_name": "具体的なタスク名",
        "description": "タスクの手順",
        "expected_impact": "High", // High | Medium | Low
        "effort_level": "Medium", // Small | Medium | Large
        "focus_point": "注意点"
      }
    ]
  }
]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // markdownコードブロックが含まれている場合は除去する
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const nodes = JSON.parse(text);

    return NextResponse.json({ nodes });

  } catch (error) {
    console.error('Failed to generate KPI tree:', error);
    return NextResponse.json({ error: 'Failed to generate KPI tree' }, { status: 500 });
  }
}
