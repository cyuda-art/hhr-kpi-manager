import re

file_path = "src/app/api/generate-manifesto/route.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace json extraction
old_extract = """    const { masterMvv, kgiType, kgiTargetValue, projectUrl, customInstructions, fileUrls } = await req.json();"""
new_extract = """    const { masterMvv, orgContext, kgiType, kgiTargetValue, projectUrl, customInstructions, fileUrls } = await req.json();"""
content = content.replace(old_extract, new_extract)

# Replace prompt
old_prompt_block = """    const prompt = `
あなたは世界トップクラスの戦略コンサルタントです。
以下の【Master MVV（組織の絶対的ルール・制約）】を絶対の制約とし、それを破る提案は絶対に行わないでください。

【Master MVV（組織の制約・行動指針）】
${masterMvv || '特に指定なし'}

【ユーザー入力情報】
- 対象事業: ${extractedText}
- 自部門のKGI: ${kgiType}
- 目標数値: ${kgiTargetValue}
- 追加指示・前提条件: ${customInstructions || '特になし'}

【タスク】
該当部門がKGIを達成するための「具体的な戦略シナリオ（Project Manifesto）」を3パターン考案してください。
例えば、顧客満足度がKGIの場合、「プロダクト改善主導」「サポート対応スピード特化」「コミュニティ形成主導」など、異なるアプローチの戦略を3つ作成してください。
※ 添付ファイル（もしあれば）の内容も考慮して、最も実現可能性とインパクトの高い作戦を提示してください。

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
`;"""

new_prompt_block = """    const prompt = `
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
  "swot": "### 強み(S)\\n...\\n### 弱み(W)\\n...\\n### 機会(O)\\n...\\n### 脅威(T)\\n...",
  "crossSwot": "### S×O (強み×機会) 戦略\\n...\\n### W×T (弱み×脅威) 防衛戦略\\n...",
  "manifestos": [
    {
      "title": "戦略アプローチのタイトル（20文字程度）",
      "description": "その戦略の具体的な内容とアクション方針（100文字程度）",
      "reason": "なぜこの戦略がSWOT分析に裏付けられ、KGI達成に繋がるかの理由（80文字程度）"
    },
    ... (計3つ)
  ]
}
`;"""
content = content.replace(old_prompt_block, new_prompt_block)

# Replace parse and return
old_return = """    text = text.replace(new RegExp('\`\`\`json', 'g'), '').replace(new RegExp('\`\`\`', 'g'), '').trim();

    const manifestos = JSON.parse(text);

    return NextResponse.json({ manifestos });"""

new_return = """    text = text.replace(new RegExp('\`\`\`json', 'g'), '').replace(new RegExp('\`\`\`', 'g'), '').trim();

    const data = JSON.parse(text);

    return NextResponse.json({ 
      manifestos: data.manifestos,
      swot: data.swot,
      crossSwot: data.crossSwot
    });"""
content = content.replace(old_return, new_return)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
