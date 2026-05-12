import re

file_path = "src/app/api/generate-org-frameworks/route.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_prompt = """    const prompt = `あなたはMBB（マッキンゼー、BCG、ベイン）クラスの戦略コンサルタントです。
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
  "pest": "### 政治的要因(P)\\n- ...\\n\\n### 経済的要因(E)\\n...",
  "fiveForces": "### 新規参入の脅威\\n- ...\\n\\n...",
  "vrio": "### 経済的価値(V)\\n- ...\\n\\n...",
  "industry": "ソフトウェア業界"
}`;"""

new_prompt = """    const prompt = `あなたはMBB（マッキンゼー、BCG、ベイン）クラスの戦略コンサルタントです。
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
}`;"""

content = content.replace(old_prompt, new_prompt)

# Parse output to stringify the nested objects before sending?
# Wait, if I change the API to return JSON objects (nested), the frontend `settings/page.tsx` needs to stringify them before storing in `updateOrganizationFrameworks` because `pest`, `fiveForces`, `vrio` are typed as `string` in `Organization`.
# So let's make the API return JSON strings for these fields.

old_parse = """    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    return NextResponse.json(data);"""

new_parse = """    const responseText = result.response.text();
    const data = JSON.parse(responseText);
    
    // 型に合わせて、オブジェクトをJSON文字列化して返却する
    const formattedData = {
      pest: typeof data.pest === 'object' ? JSON.stringify(data.pest) : data.pest,
      fiveForces: typeof data.fiveForces === 'object' ? JSON.stringify(data.fiveForces) : data.fiveForces,
      vrio: typeof data.vrio === 'object' ? JSON.stringify(data.vrio) : data.vrio,
      industry: data.industry
    };

    return NextResponse.json(formattedData);"""

content = content.replace(old_parse, new_parse)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
