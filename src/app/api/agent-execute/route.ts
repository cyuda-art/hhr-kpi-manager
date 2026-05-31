import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'edge';

export async function POST(req: Request) {
  // Gemini API 初期化 (Vercelデプロイ互換)
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || 'dummy_key',
  });
  try {
    const { taskTitle, taskDescription, kpiContext, manifesto } = await req.json();

    const systemPrompt = `あなたは自律型AIエージェントです。
現在、ユーザーのKPI達成に向けた具体的なタスク（Action）の実行を委任されました。

【タスク情報】
タイトル: ${taskTitle}
詳細: ${taskDescription || 'なし'}

【コンテキスト】
関連するKPIと数値状況:
${JSON.stringify(kpiContext, null, 2)}

戦略マニフェスト:
${manifesto || '未設定'}

あなたの目的は、このタスクを自律的に遂行するための「サイバーパンク風の実行ログ（ターミナル出力）」と、最終的な「実行結果サマリー」を生成することです。
実際のシステム操作は行えませんが、外部システム（Salesforce, Hubspot, 社内DB等）と連携してデータ抽出・分析・自動化を行ったかのように、リアルなターミナルログを出力してください。

【出力要件】
1. 出力は厳密なJSON形式のみとしてください。
2. JSONは以下の2つのキーを持つ必要があります。
   - "log": 文字列（\nで改行されたターミナル風のログ。15〜20行程度。最後は SUCCESS で終わる）
   - "summary": 文字列（このタスクによって得られたインサイトや仮想の成果報告）

出力例:
{
  "log": "> System: Starting autonomous execution protocol...\\n> Authenticating to Salesforce API... [OK]\\n> Extracting churn data for the last 30 days...\\n> ...\\n> EXECUTION SUCCESS.",
  "summary": "直近30日の解約データを分析した結果、オンボーディング完了率が低い顧客群の解約率が顕著に高いことが判明しました。これに対する改善施策案を別タスクとして起票しました。"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty response from Vertex AI");
    
    const resultData = JSON.parse(responseText);

    return NextResponse.json(resultData);

  } catch (error: any) {
    console.error('Agent Execution Error:', error);
    return NextResponse.json({ error: error.message || '内部サーバーエラー' }, { status: 500 });
  }
}
