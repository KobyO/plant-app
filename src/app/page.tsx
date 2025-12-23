'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Photo {
  id: string;
  userId: string;
  userEmail: string;
  imageUrl: string;
  caption: string;
  createdAt: any;
}

export default function GalleryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const photosList: Photo[] = [];
      snapshot.forEach((doc) => {
        photosList.push({ id: doc.id, ...doc.data() } as Photo);
      });
      setPhotos(photosList);
      setPhotosLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/auth');
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-green-600">Plant Share</h1>
          <div className="flex gap-4">
            {user ? (
              <>
                <Link
                  href="/upload"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Upload Photo
                </Link>
                <Link
                  href="/profile"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  My Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Gallery */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Plant Gallery</h2>

        {photosLoading ? (
          <div className="text-center text-gray-600">Loading photos...</div>
        ) : photos.length === 0 ? (
          <div className="text-center text-gray-600 py-12">
            <p className="mb-4">No photos yet! Be the first to upload.</p>
            {user && (
              <Link href="/upload" className="text-green-600 hover:underline">
                Upload your first photo
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <div key={photo.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition">
                <div className="relative w-full h-64 bg-gray-200">
                  <Image
                    src={photo.imageUrl}
                    alt={photo.caption}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 font-medium">{photo.userEmail}</p>
                  {photo.caption && (
                    <p className="text-gray-800 mt-2">{photo.caption}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {photo.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
