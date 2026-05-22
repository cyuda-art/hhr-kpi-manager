import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req: Request) {
  try {
    const { parentNode, customInstructions } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
あなたの任務は、指定されたKPI（重要目標達成指標）ノードをさらに深掘りし、そのKPIを構成する子ノード（ドライバー要素）を要素分解（ツリー生成）することです。

【親ノード情報】
- 親ノードID: ${parentNode.id}
- KPI名: ${parentNode.name}
- 定性目標（意味）: ${parentNode.qualitativeName}
- 目標数値: ${parentNode.targetValue} ${parentNode.unit || ''}
- ビジネスユニット: ${parentNode.businessUnit}
- 追加指示・前提条件: ${customInstructions || '特になし'}

【出力要件】
- 以下のJSONフォーマット（"nodes"を含むオブジェクト）で出力してください。
- markdownのコードブロック表記 (\`\`\`json ... \`\`\`) は絶対に含めず、純粋なJSONテキストのみを出力してください。
- 親ノード「${parentNode.name}」を構成するための子ノードを 2〜5個 生成してください。必要であればさらにその下（孫ノード）まで分解しても構いません（合計5〜10ノード程度）。
- 階層構造と数式に関する【絶対ルール】（MECEとロジックツリーの完全連動）:
  - 今回作成するノードのうち、最上位となるノードの parentId には必ず "${parentNode.id}" を指定してください。
  - 【超重要・絶対ルール】ツリーの親子関係（parentId）と計算式（formula）は完全に一致していなければなりません。
  - 今回生成したノードが、親ノード「${parentNode.name}」の数値を構成する場合、親ノード自体の計算式を更新するための情報を含めることはできません。ただし、今回生成する「直下の子ノード同士」の計算式（親から見てどう計算されるべきか）を、親ノードの "newParentFormula" というキーで特別に返却してください。
  - もしくは、最もシンプルな方法として、「親ノードを ${parentNode.name}」とする子ノードたちを作り、親ノードがどのように子ノードから計算されるかの数式を "parent_formula_suggestion" として返してください。
  - 各ノードの qualitativeName には、目標達成のための定性的な成功要因やプロセス名を設定してください。
  - IDはユニークな半角英数字にしてください（既存のIDと被らないよう、"kpi_exp_" などのプレフィックス推奨）。
  - 末端のノードのみ isCalculated: false とし、formula は空文字 "" にしてください。
- 数値（targetValue, actualValue, previousValue）は、親ノードの目標数値（${parentNode.targetValue}）と整合性が取れるように設定してください。
- 1年間のダミーデータをフロントエンドで生成するため、各ノードに事業特性を表す "trend_type" と "volatility" (0.05〜0.3) を含めてください。
- 末端のKPIノードには現場が実行すべき「タスク」を "tasks" 配列として付与してください。

【JSONフォーマット例】
{
  "parent_formula_suggestion": "#{kpi_exp_1} * #{kpi_exp_2}",
  "nodes": [
    {
      "id": "kpi_exp_1",
      "name": "新規客数",
      "qualitativeName": "新規開拓による集客",
      "businessUnit": "${parentNode.businessUnit}",
      "type": "KPI",
      "parentId": "${parentNode.id}",
      "targetValue": 5000,
      "actualValue": 0,
      "unit": "人",
      "previousValue": 0,
      "description": "新規集客の数",
      "isCalculated": false,
      "formula": "",
      "isKsf": true,
      "trend_type": "steady_growth",
      "volatility": 0.1,
      "tasks": [
        {
          "task_name": "具体的なアクションプラン1",
          "description": "タスクの詳細説明",
          "due_date": "2026-12-31"
        }
      ]
    },
    ...
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

    const response = await result.response;
    let text = response.text();

    text = text.replace(new RegExp('\`\`\`json', 'g'), '').replace(new RegExp('\`\`\`', 'g'), '').trim();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON:", text);
      throw new Error("AI output was not valid JSON");
    }

    return NextResponse.json({ 
      nodes: data.nodes || [],
      parentFormula: data.parent_formula_suggestion || ""
    });

  } catch (error) {
    console.error('Failed to expand KPI node:', error);
    return NextResponse.json({ error: 'Failed to expand KPI node' }, { status: 500 });
  }
}
