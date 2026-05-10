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
あなたはマッキンゼーやBCGなどのトップティア戦略コンサルティングファーム出身の、AI経営戦略コンサルタントです。
以下のユーザー提供情報を元に、論理的で実行可能性の高い「KGI・KSF・KPIツリー」を構築してください。

【ユーザー入力情報】
- プロジェクト名 (KGI候補): ${projectName}
- 事業概要: ${description || '未設定'}
- MVV (Mission, Vision, Value): ${mvv || '未設定'}
- 業種・ターゲット顧客: ${industry || '未設定'}
- 売上規模: ${revenueScale || '未設定'}
- 競合情報・自社の強み弱み・現状の課題: ${currentIssues || '未設定'}

【思考プロセス（内部推論のステップ）】
以下のステップ1〜3の推論を行い、その結果をJSONの "thinking_process" キーに出力してください。
ステップ1: 環境分析（3C分析・PEST）- マクロ要因から前提を明確化。
ステップ2: 戦略方針とKSFの抽出（クロスSWOT分析）- 強み×機会などから決定的に重要な成功要因（KSF）を2〜3つ抽出。
ステップ3: プロセス分解とKPIの設定（バリューチェーン・4P分析）- 各KSFを業務プロセスに分解し、計測可能な定量指標（KPI）に落とし込む。

【出力要件】
- 以下のJSONフォーマット（"thinking_process"と"nodes"を含むオブジェクト）で出力してください。
- markdownのコードブロック表記 (\`\`\`json ... \`\`\`) は絶対に含めず、純粋なJSONテキストのみを出力してください。
- "nodes" 配列内のノードは合計で10個〜15個程度作成してください。
- 階層構造と数式に関する【絶対ルール】（MECEとロジックツリーの完全連動）:
  - 1つの頂点ノード (type: "KGI", parentId: null) を必ず作成し、IDは "kgi_main" としてください。
  - KSFノード（qualitativeNameにKSF名を設定）を作り、その下にKPIノードを繋げてください（parentIdで指定）。
  - IDはユニークな半角英数字にしてください。
  - ツリー構造（親子の依存関係）は「数式による分解（要素還元）」と完全に一致しなければなりません。
  - 親ノード（例: 売上高）は、その直下の子ノードたちの四則演算（主に掛け算または足し算）によって【必ず100%過不足なく構成】されるようにしてください。
  - 良い例1（掛け算）: 「売上高 (kgi_main)」の直下には「顧客数 (kpi_1)」と「平均客単価 (kpi_2)」の2つのみを置き、売上高の formula を "#{kpi_1} * #{kpi_2}" としてください。
  - 良い例2（足し算）: 「新規リード数」の直下に「Web広告経由」と「自然検索経由」を置き、formula を "#{kpi_ad} + #{kpi_organic}" としてください。
  - 悪い例: 「売上高」の直下に「顧客数」「客単価」「従業員満足度」が並んでいる（数式で繋がらない要素が混ざっているのはNG）。
  - 子ノードを持つすべての親ノードは、必ず isCalculated: true とし、子ノードのIDを用いた正しい formula (例: "#{id1} * #{id2}") を設定してください。
  - 末端のノード（これ以上分解しない最下層）のみ isCalculated: false とし、formula は空文字 "" にしてください。
- businessUnitは "company", "hotel", "spa", "restaurant", "shop", "kitchen", "cross" のいずれかを指定してください。
- 数値（targetValue, actualValue, previousValue）は、売上規模から推測してリアリティのある数値を設定してください（単位に注意）。
- 末端のKPIノードには、現場が実行すべき具体的な「タスク（ToDo）」を1〜3個程度、"tasks" 配列として付与してください。

【JSONフォーマット例】
{
  "thinking_process": {
    "environment_analysis": "環境認識（3Cの要約）...",
    "cross_swot": "クロスSWOT分析からの洞察...",
    "ksf_reasons": "KSF選定の理由..."
  },
  "nodes": [
    {
      "id": "kgi_main",
      "name": "KGIの名前 (定量)",
      "qualitativeName": "目指す方向性 (定性)",
      "businessUnit": "company",
      "type": "KGI",
      "parentId": null,
      "targetValue": 100000000,
      "actualValue": 80000000,
      "unit": "円",
      "previousValue": 75000000,
      "description": "KGIの詳細説明",
      "isCalculated": false,
      "formula": ""
    },
    {
      "id": "kpi_child_1",
      "name": "末端KPIの名前",
      "qualitativeName": "KSFやプロセス名",
      "businessUnit": "company",
      "type": "KPI",
      "parentId": "kgi_main",
      "targetValue": 50,
      "actualValue": 0,
      "unit": "件",
      "previousValue": 0,
      "description": "KPIの詳細",
      "isCalculated": true,
      "formula": "#{kpi_grandchild_1} * #{kpi_grandchild_2}",
      "tasks": [
        {
          "task_name": "具体的なタスク名",
          "description": "タスクの手順",
          "expected_impact": "High",
          "effort_level": "Medium",
          "focus_point": "注意点"
        }
      ]
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // markdownコードブロックが含まれている場合は除去する
    text = text.replace(new RegExp('\`\`\`json', 'g'), '').replace(new RegExp('\`\`\`', 'g'), '').trim();

    const data = JSON.parse(text);
    // 元のフロントエンドの実装が nodes 配列を期待しているため、data.nodes を返す
    // 思考プロセスもあわせてフロントエンドに返却する
    const nodes = data.nodes || data;

    return NextResponse.json({ nodes, thinkingProcess: data.thinking_process });

  } catch (error) {
    console.error('Failed to generate KPI tree:', error);
    return NextResponse.json({ error: 'Failed to generate KPI tree' }, { status: 500 });
  }
}
