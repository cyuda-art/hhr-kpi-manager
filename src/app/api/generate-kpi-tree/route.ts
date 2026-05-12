import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { projectUrl, kgiType, kgiPeriod, kgiTargetValue, businessModelType, selectedManifesto, customInstructions, fileUrls, archivedKpis } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // URLからのテキスト抽出 (簡易スクレイピング)
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
              .substring(0, 3000); // トークン節約のため3000文字
            extractedText = `【URLからの抽出テキスト】\n${cleanText}`;
          }
        }
      } catch (e) {
        console.warn("URL fetch failed, falling back to raw input:", e);
      }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
あなたの任務は、フェーズ1でユーザーが選択・決定した【作戦（Project Manifesto）】を忠実に実現するための「KGI・KSF・KPIツリー」を構築することです。

【ユーザー入力情報】
- 事業概要・URLテキスト: ${extractedText}
- KGI（最終目標）: ${kgiType}
- KGIの目標期間: ${kgiPeriod}
- KGIの目標数値: ${kgiTargetValue}
- ビジネスモデルの型: ${businessModelType}
- 【重要】ユーザーが選択した作戦（Manifesto）: 
${selectedManifesto ? `タイトル: ${selectedManifesto.title}\n内容: ${selectedManifesto.description}` : '未設定'}
- 追加指示・前提条件: ${customInstructions || '特になし'}

【思考プロセス（内部推論のステップ）】
以下のステップ1〜4の推論を行い、その結果をJSONの "thinking_process" キーに出力してください。
ステップ1: 添付ファイル（もしあれば）の解析 - 画像、PDF、CSVなどの参照資料から、事業特性や既存の数値を読み解く。
ステップ2: 環境分析と作戦の解読 - 選択された作戦（Manifesto）を深く読み解き、その作戦を成功させるために最も重要となるプロセス（KSF: Key Success Factor）を特定する。
ステップ3: 階層構造の数式設計 - ユーザー指定の作戦とビジネスモデルに基づき、KGIを分解。作戦で強調されている指標をツリーの中心に据える。
ステップ4: アーカイブ資産の引き継ぎ判定 - 【アーカイブ済みKPIカタログ】が提供されている場合、新しく作成しようとしているKPIの意味と完全に合致する過去のKPIが存在するかを判定し、存在する場合はそのIDを mappedSourceId として出力する。

【アーカイブ済みKPIカタログ（再利用候補）】
${archivedKpis && archivedKpis.length > 0 ? JSON.stringify(archivedKpis.map((k: any) => ({ id: k.id, name: k.name, qualitativeName: k.qualitativeName })), null, 2) : '再利用可能なアーカイブKPIはありません。'}

【出力要件】
- 以下のJSONフォーマット（"thinking_process"と"nodes"を含むオブジェクト）で出力してください。
- markdownのコードブロック表記 (\`\`\`json ... \`\`\`) は絶対に含めず、純粋なJSONテキストのみを出力してください。
- "nodes" 配列内のノードは合計で10個〜15個程度作成してください。
- 階層構造と数式に関する【絶対ルール】（MECEとロジックツリーの完全連動）:
  - 1つの頂点ノード (type: "KGI", parentId: null) を必ず作成し、IDは "kgi_main"、nameは "${kgiType}"、targetValueは ${kgiTargetValue || 100000000} としてください。
  - 各ノードの qualitativeName には、目標達成のための定性的な成功要因やプロセス名を設定してください（重要: 「KSF:」や「プロセス:」といった接頭辞は絶対に付けないこと）。
  - IDはユニークな半角英数字にしてください。
  - 【超重要・絶対ルール】ツリーの親子関係（parentId）と計算式（formula）は完全に一致していなければなりません。あるノードが2つの変数で計算される場合（例: A / B）、そのノードの「直下（parentIdがそのノードのID）」には、必ずAとBの2つのノードのみが配置されなければなりません。中間に計算に関与しないノードを絶対に挟んではいけません。
  - 親ノード（例: 売上高）は、その直下の子ノードたちの四則演算（主に掛け算または足し算、割り算）によって【必ず100%過不足なく構成】されるようにしてください。
  - 良い例1（掛け算）: 「売上高 (kgi_main)」の直下には「顧客数 (kpi_1)」と「平均客単価 (kpi_2)」の2つのみを置き、売上高の formula を "#{kpi_1} * #{kpi_2}" としてください。
  - 良い例2（割り算の率指標）: 「アンケート最高評価率 (kgi_main)」の場合、直下の子ノードは必ず「最高評価回答数 (kpi_1)」と「アンケート回答総数 (kpi_2)」の2つとし、formula を "#{kpi_1} / #{kpi_2} * 100" としてください。直下に「顧客満足度スコア」のような数式を持たない単一の中間ノードを絶対に挟まないでください。
  - 悪い例: 「アンケート最高評価率」の直下に「満足度ドライバースコア」という1つのノードがあり、さらにその下に「回答数」がある（計算式の参照先と親子関係が一致していないため致命的なエラーとなります）。
  - 子ノードを持つすべての親ノードは、必ず isCalculated: true とし、子ノードのIDを用いた正しい formula (例: "#{id1} * #{id2}" や "#{id1} / #{id2} * 100") を設定してください。
  - 【警告】formula には、絶対にノードの「名前（日本語など）」を含めてはいけません。必ず #{node_id} のようにIDを指定してください。 例: [×間違い] #{売上高} * #{客数} -> [○正解] #{kpi_1} * #{kpi_2}
  - 末端のノード（これ以上分解しない最下層）のみ isCalculated: false とし、formula は空文字 "" にしてください。
- 戦略上、作戦（Manifesto）を実行する上で最も重要となるノード（KSFとなるノード）には、必ず "isKsf": true のフラグを立ててください（複数可）。
- businessUnitは "company", "hotel", "spa", "restaurant", "shop", "kitchen", "cross" のいずれかを指定してください。
- 数値（targetValue, actualValue, previousValue）は、売上規模から推測してリアリティのある数値を設定してください（単位に注意）。
- 【重要】単位（unit）が「%」の指標（商談化率、利益率など）の場合、数値は0.2のような小数ではなく、必ず100倍した数値（例: 20%の場合は「20」）で設定してください。
- アーカイブKPIと文脈が完全に合致すると判断した場合のみ、そのアーカイブKPIのIDを "mappedSourceId" に指定してください。合致しない場合は指定しないでください（nullまたは省略）。
- 1年間のダミーデータをフロントエンドで生成するため、各ノードに事業特性を表す "trend_type" (steady_growth, seasonal_summer, seasonal_winter, flat_random のいずれか) と、日々の数値のブレ幅を表す "volatility" (0.05〜0.3の数値) を必ず含めてください。
- 末端のKPIノードには、現場が実行すべき具体的な「タスク（ToDo）」を1〜3個程度、"tasks" 配列として付与してください。

【JSONフォーマット例】
{
  "thinking_process": {
    "environment_analysis": "環境認識（3Cの要約）...",
    "cross_swot": "クロスSWOT分析からの洞察...",
    "ksf_reasons": "KSF選定の理由..."
  },
  "nodes": [
    {
      "id": "kgi_main",
      "name": "KGIの名前 (定量)",
      "qualitativeName": "目指す方向性（※接頭辞なし）",
      "businessUnit": "company",
      "type": "KGI",
      "parentId": null,
      "targetValue": 100000000,
      "actualValue": 80000000,
      "unit": "円",
      "previousValue": 75000000,
      "description": "KGIの詳細説明",
      "isCalculated": true,
      "formula": "#{kpi_child_1} * #{kpi_child_2}",
      "mappedSourceId": "kpi_xxx", // 合致するアーカイブKPIがある場合のみ指定
      "isKsf": true // 戦略上特に重要なノードにはtrueを付与
    },
    {
      "id": "kpi_child_1",
      "name": "末端KPIの名前",
      "qualitativeName": "新規顧客の獲得と初期単価向上（※接頭辞なし）",
      "businessUnit": "company",
      "type": "KPI",
      "parentId": "kgi_main",
      "targetValue": 50,
      "actualValue": 0,
      "unit": "件",
      "previousValue": 0,
      "description": "KPIの詳細",
      "isCalculated": false,
      "formula": "",
      "trend_type": "steady_growth", // steady_growth | seasonal_summer | seasonal_winter | flat_random のいずれか
      "volatility": 0.1, // 日々のブレ幅（0.05〜0.3）
      "tasks": [
        {
          "task_name": "具体的なタスク名",
          "description": "タスクの詳細な手順や前提条件など",
          "start_date": "YYYY-MM-DD",
          "due_date": "YYYY-MM-DD",
          "expected_impact": "High",
          "effort_level": "Medium",
          "focus_point": "注意点"
        }
      ]
    }
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
            // Gemini 1.5は画像、PDF、テキストなどのinlineDataをサポート
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

    // markdownコードブロックが含まれている場合は除去する
    text = text.replace(new RegExp('\`\`\`json', 'g'), '').replace(new RegExp('\`\`\`', 'g'), '').trim();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON:", text);
      throw new Error("AI output was not valid JSON");
    }
    // 元のフロントエンドの実装が nodes 配列を期待しているため、data.nodes を返す
    // 思考プロセスもあわせてフロントエンドに返却する
    const nodes = data.nodes || data;

    return NextResponse.json({ nodes, thinkingProcess: data.thinking_process });

  } catch (error) {
    console.error('Failed to generate KPI tree:', error);
    return NextResponse.json({ error: 'Failed to generate KPI tree' }, { status: 500 });
  }
}
