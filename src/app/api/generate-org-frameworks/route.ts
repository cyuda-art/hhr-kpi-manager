import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { url, companyName, masterMvv } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: '有効なURLを入力してください' }, { status: 400 });
    }

    // URLからテキスト抽出
    let extractedText = "";
    try {
      const fetchRes = await fetch(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, 
        signal: AbortSignal.timeout(8000) 
      });
      if (fetchRes.ok) {
        const html = await fetchRes.text();
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
          extractedText = bodyMatch[1]
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 8000); // 8000文字まで抽出
        }
      } else {
         return NextResponse.json({ error: 'URLの読み込みに失敗しました (ステータス: ' + fetchRes.status + ')' }, { status: 400 });
      }
    } catch (e) {
      console.warn("URL fetch failed:", e);
      return NextResponse.json({ error: 'URLの読み込みに失敗しました' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `あなたはMBB（マッキンゼー、BCG、ベイン）クラスの戦略コンサルタントです。
以下の企業情報（ウェブサイト抽出テキスト）と基本情報を基に、この企業を取り巻くマクロ環境および業界構造を分析してください。

【企業基本情報】
企業名: ${companyName}
MVV（理念）: ${masterMvv || '未設定'}
URL: ${url}

【ウェブサイト抽出テキスト】
${extractedText}

【指示】
以下の3つのビジネスフレームワークについて、プロフェッショナルな視点で簡潔かつ鋭い分析を行い、JSON形式で出力してください。
各分析結果はマークダウン（箇条書きなど）を含めた文字列として返却してください。

1. PEST分析 (Politics, Economy, Society, Technology)
2. 5フォース分析 (Five Forces)
3. VRIO分析 (Value, Rarity, Imitability, Organization)
4. 推定される業界名 (industry)

出力形式（厳密なJSON）:
{
  "pest": "### 政治的要因(P)\n- ...\n\n### 経済的要因(E)\n...",
  "fiveForces": "### 新規参入の脅威\n- ...\n\n...",
  "vrio": "### 経済的価値(V)\n- ...\n\n...",
  "industry": "ソフトウェア業界"
}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2, // 分析的な回答にするため低め
      }
    });

    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Org Frameworks Generation Error:', error);
    return NextResponse.json({ error: error.message || '内部サーバーエラー' }, { status: 500 });
  }
}
