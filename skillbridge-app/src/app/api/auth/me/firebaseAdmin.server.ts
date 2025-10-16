import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}


const firestore = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { firestore, auth, storage };
export default admin;