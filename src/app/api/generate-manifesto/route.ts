import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req: Request) {
  try {
    const { masterMvv, orgContext, kgiType, kgiTargetValue, projectUrl, customInstructions, fileUrls } = await req.json();

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
あなたはMBB（マッキンゼー、BCG、ベイン）クラスの戦略コンサルタントです。
以下の【マクロ環境情報】（組織全体を取り巻く環境・強み・制約）を背景知識として、今回の対象事業（ミクロ）の戦略を立案します。

【マクロ環境情報（羅針盤）】
- 業界: ${orgContext?.industry || '未設定'}
- PEST分析: ${orgContext?.pest || '未設定'}
- 5フォース: ${orgContext?.fiveForces || '未設定'}
- VRIO（自社の強み）: ${orgContext?.vrio || '未設定'}
- Master MVV（絶対の制約・理念）: ${masterMvv || '特に指定なし'}

【プロジェクト（対象事業）情報】
- 事業概要: ${extractedText}
- 自部門のKGI: ${kgiType}
- 目標数値: ${kgiTargetValue}
- 追加指示・前提条件: ${customInstructions || '特になし'}

【タスク (Chain of Thought)】
1. まず、提供されたマクロ環境情報と事業概要を基に、この事業における「SWOT分析」を行ってください。
2. 次に、SWOTの結果から「クロスSWOT分析」を行い、具体的な戦略の方向性を導き出してください。
3. そのクロスSWOTの結果を基に、KGIを達成するための「具体的な戦略シナリオ（Project Manifesto）」を3パターン考案してください。
   ※必ず「自社の強み(S) × 市場の機会(O)」を最大化する攻めのシナリオを2つ、
   「弱み(W) × 脅威(T)」を回避または補完する防衛的なシナリオを1つ含めてください。

【出力要件】
以下のJSONフォーマットで出力してください。Markdownのコードブロックは含めないでください。
{
  "swot": "### 強み(S)\n...\n### 弱み(W)\n...\n### 機会(O)\n...\n### 脅威(T)\n...",
  "crossSwot": "### S×O (強み×機会) 戦略\n...\n### W×T (弱み×脅威) 防衛戦略\n...",
  "manifestos": [
    {
      "title": "戦略アプローチのタイトル（20文字程度）",
      "description": "その戦略の具体的な内容とアクション方針（100文字程度）",
      "reason": "なぜこの戦略がSWOT分析に裏付けられ、KGI達成に繋がるかの理由（80文字程度）"
    },
    ... (計3つ)
  ]
}
`;

    const promptParts: any[] = [{ text: prompt }];

    // アップロードされたファイル（URL）を取得し、Base64に変換してGeminiに渡す
    if (fileUrls && Array.isArray(fileUrls) && fileUrls.length > 0) {
      for (const url of fileUrls) {
        try {
          const fileRes = await fetch(url);
          if (fileRes.ok) {
            const arrayBuffer = await fileRes.arrayBuffer();
            const mimeType = fileRes.headers.get('content-type') || 'application/octet-stream';
            promptParts.push({
              inlineData: {
                data: Buffer.from(arrayBuffer).toString('base64'),
                mimeType
              }
            });
          }
        } catch (e) {
          console.error('Failed to fetch uploaded file for Gemini:', e);
        }
      }
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts: promptParts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
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
      manifestos: data.manifestos,
      swot: data.swot,
      crossSwot: data.crossSwot
    });

  } catch (error) {
    console.error('Failed to generate manifesto:', error);
    return NextResponse.json({ error: 'Failed to generate manifesto' }, { status: 500 });
  }
}
