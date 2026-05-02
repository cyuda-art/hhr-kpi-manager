import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// 認証情報の取得
const getAuth = () => {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  // Vercelなどで環境変数に設定された改行文字を元に戻す
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google credentials are not set in environment variables.');
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
};

export async function GET() {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'SPREADSHEET_ID is not configured.' }, { status: 500 });
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // "Data" というシートの A1セル に JSON文字列として保存するシンプルな手法
    // （複雑なツリー構造やアクション履歴を安全に保存・復元するため）
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Data!A1',
    });

    const rows = response.data.values;
    if (rows && rows.length > 0 && rows[0][0]) {
      const data = JSON.parse(rows[0][0]);
      return NextResponse.json(data);
    } else {
      // データがない場合は空を返す
      return NextResponse.json({ kpiData: {}, actions: [] });
    }
  } catch (error: any) {
    console.error("Sheets API GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'SPREADSHEET_ID is not configured.' }, { status: 500 });
    }

    const body = await req.json();
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // データをJSON文字列化して A1 セルに書き込む
    const jsonString = JSON.stringify(body);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Data!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[jsonString]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sheets API POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
