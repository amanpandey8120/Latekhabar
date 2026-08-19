import React from 'react';
import { ImageIcon, Upload, FolderOpen } from 'lucide-react';

/**
 * AdminMedia — accessible at /admin/media
 * Placeholder page for media/asset management.
 */
export const AdminMedia: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Media Library</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage images, thumbnails, and uploaded assets</p>
      </div>

      {/* Upload zone placeholder */}
      <div className="bg-[#1c1c1c] rounded-xl border border-dashed border-gray-600 p-12 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
          <Upload size={28} className="text-gray-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-300">Drag & drop files here</p>
          <p className="text-xs text-gray-500 mt-1">
            Supports JPEG, PNG, WebP up to 10 MB · Stored in Supabase Storage
          </p>
        </div>
        <button
          disabled
          className="px-4 py-2 bg-primary/40 text-white/50 rounded-xl text-xs font-semibold cursor-not-allowed"
        >
          Browse Files (Coming Soon)
        </button>
      </div>

      {/* Recent uploads grid placeholder */}
      <div className="bg-[#1c1c1c] rounded-xl border border-gray-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FolderOpen size={18} className="text-primary" />
          <h2 className="text-sm font-bold text-white">Recent Uploads</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-gray-800 flex items-center justify-center"
            >
              <ImageIcon size={24} className="text-gray-600" />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center pt-2">
          Media management integration with Supabase Storage coming soon.
        </p>
      </div>
    </div>
  );
};
