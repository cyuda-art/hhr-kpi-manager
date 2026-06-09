import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(req: Request) {
  try {
    const { projectUrl, kgiType, kgiPeriod, kgiTargetValue, businessModelType, selectedManifesto, customInstructions, fileUrls } = await req.json();

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

【出力要件】
- 以下のJSONフォーマット（"thinking_process"と"nodes"を含むオブジェクト）で出力してください。
- markdownのコードブロック表記 (\`\`\`json ... \`\`\`) は絶対に含めず、純粋なJSONテキストのみを出力してください。
- "nodes" 配列内のノードは合計で4個〜7個程度作成してください。今回は「全体像（構造）」を作るフェーズです。
- 階層構造と数式に関する【絶対ルール】（MECEとロジックツリーの完全連動）:
  - 1つの頂点ノード (type: "KGI", parentId: null) を必ず作成し、IDは "kgi_main"、nameは "${kgiType}"、targetValueは ${kgiTargetValue || 100000000}、updateFrequencyは "yearly" としてください。
  - 【必須の階層構造】ツリーは「経営理念 → 企業理念 → マニフェスト → ゴール → KGI → KSF → 各種KPI」の立て付けを前提とします。ここではKGIを頂点とし、その下にKSF、さらにその下に各種KPIを展開してください。
  - 【数式の絶対ルール】末端のノード（最下層のKPI）を除き、ツリーの中間・上位ノードは必ず**2つ以上のKPI（子ノード）を用いた四則演算**によって計算・算出される必要があります。
  - 【禁止事項】「月次数値を30で割って日次に変換する（例: #{A} / 30）」や「単一の指標をそのまま引き継ぐ（例: #{A} * 1）」のような、単位変換や単一ノードの継承による数式は絶対に禁止です。必ず「A + B」や「A * B」のように2つ以上の要素に分解してください。
  - 各ノードの qualitativeName には、目標達成のための定性的な成功要因やプロセス名を設定してください（重要: 「KSF:」や「プロセス:」といった接頭辞は絶対に付けないこと）。
  - IDはユニークな半角英数字にしてください。
  - 【超重要・絶対ルール】ツリーの親子関係（parentId）と計算式（formula）は完全に一致していなければなりません。
  - 【ハイブリッド構造の強制】多角化事業（ホールディングスなど）の場合、KGIの直下（第2階層）は直ちに『客数×単価』に要素分解するのではなく、必ず『事業部別（ホテル事業、飲食事業など）』の構造分解（足し算）を行ってください。さらに第3階層で『店舗別・エリア別』に分解します。
  - この初期フェーズでは、店舗別・エリア別までの分解（構造分解）までで生成をストップさせ、それ以上の「客数×単価」といった要素分解は行わないでください（現場の要素分解は後でユーザーが自動展開機能を使います）。
  - 親ノードは、その直下の【2つ以上の】子ノードたちの四則演算（主に足し算）によって必ず100%過不足なく構成されるようにしてください。
  - 良い例（足し算）: 「全社売上高 (kgi_main)」の直下には「ホテル事業売上 (div_1)」「温浴事業売上 (div_2)」を置き、formula を "#{div_1} + #{div_2}" としてください。
  - 悪い例: 「アンケート最高評価率」の直下に「満足度ドライバースコア」という1つのノードがあり、さらにその下に「回答数」がある（計算式の参照先と親子関係が一致していないため致命的なエラーとなります）。
  - 子ノードを持つすべての親ノードは、必ず isCalculated: true とし、子ノードのIDを用いた正しい formula (例: "#{id1} * #{id2}" や "#{id1} / #{id2} * 100") を設定してください。
  - 【警告】formula には、絶対にノードの「名前（日本語など）」を含めてはいけません。必ず #{node_id} のようにIDを指定してください。 例: [×間違い] #{売上高} * #{客数} -> [○正解] #{kpi_1} * #{kpi_2}
  - 末端のノード（これ以上分解しない最下層）のみ isCalculated: false とし、formula は空文字 "" にしてください。
- 戦略上、作戦（Manifesto）を実行する上で最も重要となるノード（KSFとなるノード）には、必ず "isKsf": true のフラグを立ててください（複数可）。
- businessUnitは "company", "hotel", "spa", "restaurant", "shop", "kitchen", "cross" のいずれかを指定してください。
- 数値（targetValue, actualValue, previousValue）は、親ノードの計算式（formula）と完全に整合性が取れるように設定してください。計算が合わない数値はエラーになります。
- 【重要】単位（unit）が「%」の指標（商談化率、利益率など）の場合、数値は0.2のような小数ではなく、必ず100倍した数値（例: 20%の場合は「20」）で設定してください。
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
      "actualValue": 0,
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
            promptParts.push({
              inlineData: {
                data: arrayBufferToBase64(arrayBuffer),
                mimeType
              }
            });
          }
        } catch (e) {
          console.error('Failed to fetch uploaded file for Gemini:', e);
        }
      }
    }

    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: promptParts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // VercelのInitial Response Timeout（10秒の壁）を即座に突破するため、最初に空白を送信
          controller.enqueue(new TextEncoder().encode(" "));
          
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      }
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/plain' } });

  } catch (error: any) {
    console.error('Failed to generate KPI tree:', error);
    return NextResponse.json({ error: error?.message || 'Failed to generate KPI tree' }, { status: 500 });
  }
}
