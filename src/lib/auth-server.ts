import * as admin from 'firebase-admin';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Firebase Adminの初期化（二重初期化の防止）
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // 環境変数内の改行文字をエスケープ解除
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      console.warn('⚠️ Firebase Admin SDK: Environment variables are missing. Initialization skipped.');
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

/**
 * リクエストヘッダーからトークンを検証し、該当するDBユーザー（権限付き）を返します。
 */
export async function authenticateRequest(request: Request | NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Unauthorized: Missing or invalid token' };
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    let firebaseUid = '';

    // 【開発・ローカルテスト用のフォールバック】
    if (token.startsWith('mock_')) {
      firebaseUid = token.replace('mock_', '');
      console.warn(`⚠️ Using mock auth for uid: ${firebaseUid}`);
    } else {
      // 本番用の正規ルート
      if (admin.apps.length > 0) {
        const decodedToken = await admin.auth().verifyIdToken(token);
        firebaseUid = decodedToken.uid;
      } else {
        // Firebase Adminの環境変数がない場合の緊急フォールバック（MVP用）
        // JWTトークンのペイロード部分（真ん中）をBase64デコードしてuidを抽出します（※署名検証なし）
        console.warn('⚠️ Firebase Admin SDK is NOT initialized. Decoding JWT without signature verification (Insecure fallback).');
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
          const payload = JSON.parse(payloadJson);
          firebaseUid = payload.user_id || payload.uid;
        }
        
        if (!firebaseUid) {
          throw new Error('Failed to extract uid from token payload');
        }
      }
    }

    // データベースからユーザー情報とRole（権限）を取得
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      include: { organization: true },
    });

    if (!user) {
      return { user: null, error: 'User not found in database' };
    }

    return { user, error: null };
  } catch (error: any) {
    console.error('Token verification failed:', error.message);
    return { user: null, error: 'Unauthorized: Token verification failed' };
  }
}

/**
 * プロジェクト（ツリー）操作の権限（RBAC）を検証します
 * @param user DBのユーザー情報
 * @param requiredRole 必要な最低権限（'MEMBER' 以上の操作など）
 */
export function hasPermission(user: any, action: 'READ' | 'WRITE' | 'DELETE') {
  // ADMIN: 全ての権限あり
  if (user.role === 'ADMIN') return true;
  
  // MEMBER: 閲覧・作成・更新・削除が可能
  if (user.role === 'MEMBER') {
    return true; 
  }

  // VIEWER: 閲覧のみ（WRITE, DELETEは不可）
  if (user.role === 'VIEWER') {
    if (action === 'READ') return true;
    return false;
  }

  return false;
}
