import { NextRequest, NextResponse } from 'next/server';

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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Firebase Storage via REST API
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const fileName = `photos/${userId}/${Date.now()}-${file.name}`;

    const uploadResponse = await fetch(
      `https://www.googleapis.com/upload/storage/v1/b/${storageBucket}/o?uploadType=media&name=${encodeURIComponent(
        fileName
      )}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          Authorization: `Bearer ${idToken}`,
        },
        body: buffer,
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('Storage upload error:', error);
      throw new Error('Failed to upload to Storage');
    }

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
      const error = await docResponse.text();
      console.error('Firestore error:', error);
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
