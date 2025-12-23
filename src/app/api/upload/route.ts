import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin (use service account from environment)
const apps = getApps();
if (apps.length === 0) {
  // For development, we'll use the web SDK approach through a workaround
  // In production, you'd use a service account key
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const userEmail = formData.get('userEmail') as string;
    const caption = formData.get('caption') as string;
    const idToken = formData.get('idToken') as string;

    if (!file || !userId || !idToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the token with Firebase (optional, for extra security)
    // This is a basic implementation - in production you'd want to verify the token

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Firebase Storage via REST API
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const fileName = `photos/${userId}/${Date.now()}-${file.name}`;

    const response = await fetch(
      `https://www.googleapis.com/upload/storage/v1/b/${storageBucket}/o?uploadType=media&name=${encodeURIComponent(
        fileName
      )}&access_token=${idToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: buffer,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload to Storage');
    }

    const uploadedFile = await response.json();
    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(
      fileName
    )}?alt=media`;

    // Save metadata to Firestore via REST API
    const firestoreProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const docResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${firestoreProjectId}/databases/(default)/documents/photos`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          fields: {
            userId: { stringValue: userId },
            userEmail: { stringValue: userEmail },
            imageUrl: { stringValue: downloadURL },
            caption: { stringValue: caption },
            createdAt: { timestampValue: new Date().toISOString() },
          },
        }),
      }
    );

    if (!docResponse.ok) {
      throw new Error('Failed to save photo metadata');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
