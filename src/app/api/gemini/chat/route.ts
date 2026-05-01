import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const { message, kpiContext, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // チャットのシステムプロンプト的なものを構築
    let systemContext = `あなたは経営コンサルタントとして、ユーザーのKPI管理と目標達成を支援するAIアシスタントです。
プロフェッショナルかつ親しみやすいトーンで回答してください。`;

    if (kpiContext) {
      systemContext += `\n現在ユーザーが注目しているKPIのデータ:\n${JSON.stringify(kpiContext, null, 2)}`;
    }

    // Google Generative AI の ChatSession を使って履歴を考慮する
    const formattedHistory = history ? history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })) : [];

    // System instruction is supported in gemini-1.5-flash and later, but for compatibility we can prepend it to the first message or use systemInstruction field.
    // To be safe across versions, we'll initialize the chat with history. If history is empty, we just send a single prompt.
    
    const chat = model.startChat({
      history: formattedHistory,
      systemInstruction: { parts: [{ text: systemContext }] , role: 'system'} as any // Ignore type error for older SDKs if any
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to generate chat response.' }, { status: 500 });
  }
}
