import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';

export default function UploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <p>Please sign in to upload photos</p>
        <Link href="/auth" className="text-green-600 hover:underline">Go to Sign In</Link>
      </div>
    );
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Upload image to Firebase Storage
      const storageRef = ref(storage, `photos/${user.uid}/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Save photo metadata to Firestore
      await addDoc(collection(db, 'photos'), {
        userId: user.uid,
        userEmail: user.email || '',
        imageUrl: downloadURL,
        caption: caption,
        createdAt: serverTimestamp(),
      });

      setFile(null);
      setCaption('');
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-green-600 hover:underline mb-6 block">
          ← Back to Gallery
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Your Plant Photo</h1>

          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
              {file && <p className="text-sm text-gray-600 mt-1">Selected: {file.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caption (optional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption about your plant..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 h-24 resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
