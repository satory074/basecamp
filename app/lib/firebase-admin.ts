/**
 * Firebase Admin SDK 初期化（シングルトン）
 * サービスアカウントキーを環境変数から読み込み、Firestoreインスタンスを提供する
 */

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let db: Firestore | undefined;

function getFirebaseApp(): App | null {
    if (app) return app;

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
        console.error("Missing Firebase credentials in environment variables");
        return null;
    }

    // 既存のアプリがあればそれを使う
    if (getApps().length > 0) {
        app = getApps()[0];
        return app;
    }

    app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
    });

    return app;
}

export function getFirestoreDb(): Firestore | null {
    if (db) return db;

    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) return null;

    db = getFirestore(firebaseApp);
    return db;
}
