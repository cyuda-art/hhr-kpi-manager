import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { company_info, kgi, ksf, kpi, current_status } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
# Role (役割)
あなたは、企業の経営戦略を具体的な実行計画に分解し、KPI達成を強力に推進する「戦略実行ナビゲーター（AIエージェント）」です。
経営層の定めた抽象的なKSF（重要成功要因）を、現場のメンバーが迷わず実行できる解像度（ワークフローとタスク）に落とし込む専門家として振る舞ってください。

# Objective (目的)
入力された【前提情報】と【KGI・KSF・KPI】を論理的に分析し、KPIを達成するための現実的かつ効果的な【ワークフロー（マイルストーン）】と【個別タスク（ToDo）】を生成すること。

# Input (入力変数)
以下の情報を基に思考を組み立ててください。
- 企業・チーム情報 (リソース制約): ${company_info || '未設定'}
- KGI (最終目標): ${kgi || '未設定'}
- KSF (今回タスク化する重要成功要因): ${ksf || '未設定'}
- KPI (測定指標と目標値): ${kpi || '未設定'}
- 現状の課題・KPI進捗 (※軌道修正時のみ入力): ${current_status || '特になし'}

# Instructions & Constraints (指示と制約条件)
1. 階層構造とKPIへの分解 (一本道フロー):
   入力された目標（KGI/KPI）を達成するためのプロセスを、1〜4つの大項目（Phase）に分けてください。
   この際、各Phase自体が「下位のKSF（定性的な重要成功要因）」となります。
   また、そのPhaseの達成を測るためのマイルストーンとして「下位のKPI（定量的な指標名、目標値、単位）」を必ずセットで生成してください。
2. タスクの具体性と解像度:
   各タスクは「何を・どうする」が明確なアクションベースで記述してください。（例：「マーケティング強化」ではなく「既存顧客向けにツール活用事例の導入事例記事を2本作成する」）
3. リソースの最適化:
   企業・チーム情報のリソース制約（人員、予算、期間など）を厳格に守り、非現実的な提案は排除してください。
4. インパクトと工数の見積もり:
   各タスクについて、KPIに対する「期待されるインパクト（High/Medium/Low）」と「想定工数（例：Small/Medium/Large）」を見積もってください。
5. 軌道修正と適応 (適応的プランニング):
   現状の課題・KPI進捗に「KPIの進捗が芳しくない」という情報が含まれている場合、既存の施策のボトルネックを推論し、問題を突破するための「改善・修正タスク」を優先的に生成してください。

# Output Format (出力形式)
システムでパースしてUIに反映させるため、必ず以下のJSONスキーマに従って出力してください。マークダウンのコードブロック(\`\`\`json \`\`\`)は使用せず、純粋なJSONテキストのみを出力してください。

{
  "ksf_analysis": "入力されたKSFとKPIを達成するためのAIの戦略的見解（簡潔に）",
  "workflow": [
    {
      "phase_name": "フェーズ名（定性的なKSF。例：新規リード獲得基盤の構築）",
      "objective": "このフェーズで達成すべき状態",
      "kpi_name": "フェーズ達成を測るKPI名（例：新規問い合わせ数）",
      "target_value": 50,
      "unit": "件",
      "tasks": [
        {
          "task_name": "具体的なタスク名",
          "description": "タスクの具体的な実行内容と手順",
          "expected_impact": "High", // High | Medium | Low
          "effort_level": "Medium", // Small | Medium | Large
          "focus_point": "このタスクを実行する上でKPIを落とさないための注意点"
        }
      ]
    }
  ],
  "kpi_advice": "KPIをモニタリングする際の指標のブレイクダウンや、先行指標（ピタゴラス的指標）の提案"
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // markdownコードブロックを除去
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const workflowData = JSON.parse(text);

    return NextResponse.json({ data: workflowData });

  } catch (error) {
    console.error('Failed to generate workflow:', error);
    return NextResponse.json({ error: 'Failed to generate workflow' }, { status: 500 });
  }
}
