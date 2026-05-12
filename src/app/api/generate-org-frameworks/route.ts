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
以下の3つのビジネスフレームワークについて、プロフェッショナルな視点で簡潔かつ鋭い分析を行い、構造化されたJSON形式で出力してください。
各項目の内容は、50文字程度の端的なインサイトを記載してください。

1. PEST分析 (Politics, Economy, Society, Technology)
2. 5フォース分析 (Five Forces)
3. VRIO分析 (Value, Rarity, Imitability, Organization)
4. 推定される業界名 (industry)

出力形式（厳密なJSON）:
{
  "pest": {
    "politics": "政治・法律的要因の分析...",
    "economy": "経済的要因の分析...",
    "society": "社会的要因の分析...",
    "technology": "技術的要因の分析..."
  },
  "fiveForces": {
    "rivalry": "既存企業間の敵対関係の分析...",
    "newEntrants": "新規参入の脅威の分析...",
    "substitutes": "代替品の脅威の分析...",
    "suppliers": "売り手の交渉力の分析...",
    "buyers": "買い手の交渉力の分析..."
  },
  "vrio": {
    "value": "経済的な価値(V)の分析...",
    "rarity": "希少性(R)の分析...",
    "imitability": "模倣困難性(I)の分析...",
    "organization": "組織(O)の分析..."
  },
  "industry": "ホテル・宿泊業界"
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
    
    // 型に合わせて、オブジェクトをJSON文字列化して返却する
    const formattedData = {
      pest: typeof data.pest === 'object' ? JSON.stringify(data.pest) : data.pest,
      fiveForces: typeof data.fiveForces === 'object' ? JSON.stringify(data.fiveForces) : data.fiveForces,
      vrio: typeof data.vrio === 'object' ? JSON.stringify(data.vrio) : data.vrio,
      industry: data.industry
    };

    return NextResponse.json(formattedData);

  } catch (error: any) {
    console.error('Org Frameworks Generation Error:', error);
    return NextResponse.json({ error: error.message || '内部サーバーエラー' }, { status: 500 });
  }
}
