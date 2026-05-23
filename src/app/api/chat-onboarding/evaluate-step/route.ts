import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

const STEP_DEFINITIONS = [
  { step: 1, key: 'vision', name: 'VISION（究極の目的）', desc: 'ユーザーが最終的に成し遂げたいこと、ありたい姿' },
  { step: 2, key: 'mission', name: 'MISSION（価値観・使命）', desc: '目的を果たすために大切にする価値観や日々の使命' },
  { step: 3, key: 'manifesto', name: 'MANIFESTO（作戦）', desc: '現状を踏まえてこれから注力する具体的な作戦やテーマ' },
  { step: 4, key: 'goal', name: 'GOAL（定性ゴール）', desc: '作戦が成功したと言える定性的な到達状態' },
  { step: 5, key: 'kgi', name: 'KGI（定量目標）', desc: 'ゴールを客観的に測るための最終的な数値目標（例：売上1億円、体重-5kg）' },
  { step: 6, key: 'ksf', name: 'KSF（重要成功要因）', desc: 'KGIを達成するために絶対に外せない成功の鍵' },
  { step: 7, key: 'kpi', name: 'KPI（行動指標）', desc: 'KSFを実現するための具体的な日々の行動目標' }
];

export async function POST(req: Request) {
  try {
    const { step, userInput, chatHistory, collectedData } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const currentStepDef = STEP_DEFINITIONS.find(s => s.step === step);
    const nextStepDef = STEP_DEFINITIONS.find(s => s.step === step + 1);

    if (!currentStepDef) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
あなたはユーザーの目標達成を導く優秀なコーチAIです。
現在、ユーザーから「${currentStepDef.name}」を引き出すためのヒヤリング（Step ${step}/7）を行っています。

【これまでに確定した情報】
${JSON.stringify(collectedData, null, 2)}

【現在のステップの要件】
${currentStepDef.name}: ${currentStepDef.desc}

【ユーザーからの最新の入力】
${userInput}

【あなたのタスク】
ユーザーの入力を評価し、以下のJSONフォーマットで回答してください。

1. ユーザーの入力が現在の要件（${currentStepDef.name}）を十分に満たしているか判定してください。
   - 満たしている場合、または要約して満たせそうな場合： isComplete = true にし、extractedValue にその要約・洗練されたテキストを格納してください。
   - 曖昧すぎる、あるいは質問返しをしてきている場合： isComplete = false にし、extractedValue は null にしてください。
2. isComplete が true の場合、AIからの返答文（reply）には「ユーザーへの共感・称賛」と、「次のステップ（${nextStepDef ? nextStepDef.name : 'ツリー生成'}）への質問」を自然な会話体で含めてください。
3. isComplete が false の場合、AIからの返答文（reply）には、ユーザーの思考を深めるための壁打ちの質問や、助け舟となる具体例の提案を含めてください。

出力要件:
- 純粋なJSONのみを出力してください（マークダウンの \`\`\`json 等は不要）。
- JSONスキーマ:
{
  "isComplete": boolean,
  "extractedValue": string | null,
  "reply": string
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
    console.error('Failed in chat onboarding:', error);
    return NextResponse.json({ error: error?.message || 'Failed to process' }, { status: 500 });
  }
}
