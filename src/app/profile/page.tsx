'use client';

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

interface Photo {
  id: string;
  userId: string;
  userEmail: string;
  imageUrl: string;
  caption: string;
  createdAt: any;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'photos'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const photosList: Photo[] = [];
      snapshot.forEach((doc) => {
        photosList.push({ id: doc.id, ...doc.data() } as Photo);
      });
      setPhotos(photosList);
      setPhotosLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleDelete = async (photo: Photo) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    setDeleting(photo.id);
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'photos', photo.id));

      // Delete from Storage
      const fileRef = ref(storage, photo.imageUrl.split('/o/')[1].split('?')[0]);
      await deleteObject(fileRef);
    } catch (err) {
      console.error('Error deleting photo:', err);
      alert('Failed to delete photo');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <p>Please sign in to view your profile</p>
        <Link href="/auth" className="text-green-600 hover:underline">Go to Sign In</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-green-600 hover:underline mb-6 block">
          ← Back to Gallery
        </Link>

        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">{user.email}</p>
          <p className="text-gray-600 mt-2">Total photos: {photos.length}</p>

          <Link
            href="/upload"
            className="inline-block mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            Upload New Photo
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Plants</h2>

        {photosLoading ? (
          <div className="text-center text-gray-600">Loading your photos...</div>
        ) : photos.length === 0 ? (
          <div className="text-center text-gray-600 py-12 bg-white rounded-lg">
            <p className="mb-4">You haven't uploaded any photos yet.</p>
            <Link href="/upload" className="text-green-600 hover:underline">
              Upload your first photo
            </Link>
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
                  {photo.caption && (
                    <p className="text-gray-800 mb-2">{photo.caption}</p>
                  )}
                  <p className="text-xs text-gray-500 mb-4">
                    {photo.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                  </p>
                  <button
                    onClick={() => handleDelete(photo)}
                    disabled={deleting === photo.id}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded-lg transition"
                  >
                    {deleting === photo.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
