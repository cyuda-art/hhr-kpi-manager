import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { masterMvv, kgiType, kgiTargetValue, projectUrl } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // URLからの簡易テキスト抽出
    let extractedText = projectUrl;
    if (projectUrl && projectUrl.startsWith('http')) {
      try {
        const fetchRes = await fetch(projectUrl, { 
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, 
          signal: AbortSignal.timeout(5000) 
        });
        if (fetchRes.ok) {
          const html = await fetchRes.text();
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          if (bodyMatch) {
            const cleanText = bodyMatch[1]
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .substring(0, 3000);
            extractedText = `【事業概要】\n${cleanText}`;
          }
        }
      } catch (e) {
        console.warn("URL fetch failed, falling back to raw input:", e);
      }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
あなたは世界トップクラスの戦略コンサルタントです。
以下の【Master MVV（組織の絶対的ルール・制約）】を絶対の制約とし、それを破る提案は絶対に行わないでください。

【Master MVV（組織の制約・行動指針）】
${masterMvv || '特に指定なし'}

【ユーザー入力情報】
- 対象事業: ${extractedText}
- 自部門のKGI: ${kgiType}
- 目標数値: ${kgiTargetValue}

【タスク】
該当部門がKGIを達成するための「具体的な戦略シナリオ（Project Manifesto）」を3パターン考案してください。
例えば、顧客満足度がKGIの場合、「プロダクト改善主導」「サポート対応スピード特化」「コミュニティ形成主導」など、異なるアプローチの戦略を3つ作成してください。

【出力要件】
以下のJSONフォーマットの配列で出力してください。Markdownのコードブロック（\`\`\`json）は含めないでください。
[
  {
    "title": "戦略アプローチのタイトル（20文字程度）",
    "description": "その戦略の具体的な内容とアクション方針（100文字程度）",
    "reason": "なぜこの戦略がKGI達成とMaster MVVに合致するのかの理由（80文字程度）"
  },
  ...
]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace(new RegExp('\`\`\`json', 'g'), '').replace(new RegExp('\`\`\`', 'g'), '').trim();

    const manifestos = JSON.parse(text);

    return NextResponse.json({ manifestos });

  } catch (error) {
    console.error('Failed to generate manifesto:', error);
    return NextResponse.json({ error: 'Failed to generate manifesto' }, { status: 500 });
  }
}
