import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

const STEP_INSTRUCTIONS: Record<number, { name: string, desc: string, target: string }> = {
  1: { name: 'VISION', desc: 'ユーザーが最終的に成し遂げたい究極の目的・夢・ビジョン。', target: 'VISIONの言語化' },
  2: { name: 'GOAL', desc: 'VISIONに向けて、直近で目指す定性的なゴールや状態。', target: '定性的なGOALの決定' },
  3: { name: 'KGI', desc: 'ゴールを客観的に測る具体的な数値目標（売上◯◯円、体重◯◯kgなど）と期限。', target: '定量的なKGIの決定' }
};

export async function POST(req: Request) {
  try {
    const { step, userInput, chatHistory, collectedData } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const currentStepInfo = STEP_INSTRUCTIONS[step];

    // これまでの会話履歴を文字列化
    const historyText = chatHistory.map((m: any) => `${m.role === 'assistant' ? 'AI' : 'ユーザー'}: ${m.content}`).join('\n');

    const prompt = `
あなたはKPIツリー（目標達成のための論理フレームワーク）を構築するための、優秀な壁打ち相手（コンサルタント）です。
ユーザーと対話（キャッチボール）しながら、現在のステップの情報を引き出し、洗練させてください。

【現在の状況】
- 現在ヒヤリング中のステップ: Step ${step} (${currentStepInfo.name})
- このステップの目的: ${currentStepInfo.desc}
- これまでに確定した情報: ${JSON.stringify(collectedData, null, 2)}

【直近の会話履歴】
${historyText}
ユーザーの最新の発言: 「${userInput}」

【あなたのタスクと出力形式】
ユーザーの発言を分析し、以下の要件を満たすJSONオブジェクトを出力してください。

1. "isComplete" (boolean): 
   ユーザーの最新の発言によって、Step ${step} (${currentStepInfo.name}) の内容が十分に明確になったと判断できる場合は true、まだ不明確で深掘りが必要な場合は false。
2. "extractedValue" (string | null): 
   isCompleteがtrueの場合、ユーザーの意図を簡潔に要約した決定事項の文字列をセット。falseの場合は null。
3. "reply" (string): 
   ユーザーへの返答。共感や賞賛を交えつつ、isCompleteがfalseなら深掘りの質問を投げかけ、trueなら「素晴らしいですね！」とまとめつつ【次のステップの質問】へ自然に繋げてください。
   ※次のステップは Step ${step + 1} (${STEP_INSTRUCTIONS[step + 1]?.name || '完了'}) です。
4. "suggestions" (string[]): 
   ユーザーが次に回答しやすくなるような「的確な提案チップ（選択肢）」を3〜4個生成してください。
   AIがユーザーの思考をリードするイメージで、前の文脈から推論した具体的な内容にしてください。
   ※文字列の配列です（例: ["提案A", "提案B", "提案C"]）。

【出力ルール】
必ず純粋なJSONオブジェクトのみを出力してください（マークダウンの \`\`\`json 等は不要）。
例:
{
  "isComplete": true,
  "extractedValue": "業界No.1の売上達成",
  "reply": "素晴らしいVISIONですね！では次に、そのVISIONを達成するためのMISSION（使命）を考えましょう。どのような価値観を大切にしたいですか？",
  "suggestions": ["圧倒的な顧客第一主義", "最新技術で業界の常識を覆す", "従業員の幸福追求"]
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

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to evaluate step:', error);
    return NextResponse.json({ error: error?.message || 'Failed to process' }, { status: 500 });
  }
}
