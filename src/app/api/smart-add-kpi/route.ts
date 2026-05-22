import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req: Request) {
  try {
    const { currentTree, query, businessUnit } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // ツリー情報の軽量化（トークン節約のため、ID,名前,数式のみを渡す）
    const simplifiedTree = currentTree.map((node: any) => ({
      id: node.id,
      name: node.name,
      formula: node.formula,
      parentId: node.parentId,
      businessUnit: node.businessUnit
    }));

    const prompt = `
あなたの任務は、既存のKPIツリーに対して、ユーザーが指定した新しいKPIを【最適な位置】に【ツリー構造（因果関係）として】追加するための「差分データ（Patch）」を生成することです。

【ユーザーの要望】
追加したいKPIや要素: "${query}"

【現在のツリー構造】
${JSON.stringify(simplifiedTree, null, 2)}

【処理ステップと出力要件】
1. 現在のツリーの中で、ユーザーが追加したいKPIを直接ぶら下げるのに最も論理的な既存の「親ノード」を1つだけ選定してください。
2. もし、その親ノードの下にいきなり要望のKPIを置くのが不自然な場合（論理の飛躍がある場合）、間に「中間ノード（上位・中位KPI）」を1〜2個作成して繋いでください。
3. ユーザーが要望したKPI自体のノードを作成し、さらにその目標を達成するための「下位ノード（ドライバー要素やプロセス）」を2〜3個作成してください。
4. 【大原則】新しく中間ノードを作成する場合は、必ず「2つ以上」の下位ノードに分解してください。1つの親に対して1つの子しか持たない（1対1の紐付け）状態は計算式が「A = B」となり無意味なため、絶対に避けてください。
5. 【超重要・絶対ルール】既存の「親ノード」の計算式（formula）を、新しく追加する直下のノードのIDを含めた形にアップデートしてください。
6. 【超重要・絶対ルール】新しく作成するノードが子ノードを持つ（中間ノードになる）場合、必ず "isCalculated": true とし、その子ノードのIDを用いた計算式を "formula" に設定してください。
7. 【超重要・絶対ルール】KGIはシステム全体で1つしか存在してはいけません。ユーザーが「KGIを追加して」と言った場合でも、絶対に "type": "KGI" を作成しないでください。新しく作成する全てのノードは必ず "type": "KPI" としてください。
8. 以下のJSONフォーマット（"updatedParent" と "newNodes"）で出力してください。
9. markdownのコードブロック表記 (\`\`\`json ... \`\`\`) は絶対に含めず、純粋なJSONテキストのみを出力してください。
10. 新しく生成するノードのIDは、"kpi_smart_1", "kpi_smart_2" のように一意なものにしてください。

【出力JSONフォーマット】
{
  "updatedParent": {
    "id": "（接続先に選んだ既存のノードのID）",
    "newFormula": "（既存の式に新しいノードを組み込んだ、計算可能な正しい数式。例: #{kpi_1} + #{kpi_smart_1}）"
  },
  "newNodes": [
    {
      "id": "kpi_smart_1",
      "name": "追加した中間KPIまたは要望のKPI",
      "qualitativeName": "定性的な目標・意味",
      "businessUnit": "${businessUnit || 'company'}",
      "type": "KPI",
      "parentId": "（接続先に選んだ既存ノードのID、または他の中間ノードのID）",
      "targetValue": 100,
      "actualValue": 0,
      "unit": "件",
      "previousValue": 0,
      "description": "AIによる自動生成",
      "isCalculated": true,
      "formula": "#{kpi_smart_2} + #{kpi_smart_3}",
      "isKsf": false,
      "trend_type": "steady_growth",
      "volatility": 0.1,
      "tasks": []
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

    // AIの暴走防止：万が一 type: "KGI" が含まれていた場合、強制的に KPI に変換する
    if (data.newNodes && Array.isArray(data.newNodes)) {
      data.newNodes = data.newNodes.map((node: any) => {
        if (node.type === 'KGI') {
          node.type = 'KPI';
        }
        return node;
      });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Failed to smart add KPI:', error);
    return NextResponse.json({ error: 'Failed to smart add KPI' }, { status: 500 });
  }
}
