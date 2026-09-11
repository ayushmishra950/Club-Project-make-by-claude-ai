import { useEffect, useRef, useState } from "react";
import { X, Users as UsersIcon, Heart, MessageCircle } from "lucide-react";

const PostDetailCard = ({ post, isOpen, onClose }: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideRef = useRef<any>(null);

  useEffect(() => {
    if (!post?.images?.length) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === post.images.length - 1 ? 0 : prev + 1
      );
    }, 3000); // 3 seconds per slide

    return () => clearInterval(interval);
  }, [post?.images]);

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* Background Blur */}
  <div
    className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
    onClick={onClose}
  />

  {/* Center Card */}
  <div className="relative z-50 max-w-2xl w-full bg-white rounded-lg shadow-lg overflow-y-auto max-h-[90vh]">
    
    {/* Close Button (top right corner, always visible) */}
    <button
      onClick={onClose}
      className="absolute top-3 right-3 z-50 rounded-full p-1 hover:bg-gray-200"
    >
      <X className="w-5 h-5" />
    </button>

        {/* Image Carousel */}
        <div className="w-full h-60 overflow-hidden rounded-t-lg relative">
          <div
            ref={slideRef}
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
          {post.images?.map((media: string, idx: number) => {
  const isVideo = media.match(/\.(mp4|webm|ogg)$/i); // video extension check

  return isVideo ? (
    <video
      key={idx}
      src={media}
      className="w-full flex-shrink-0 h-60 object-cover"
      muted
      loop
      autoPlay
      playsInline
    />
  ) : (
    <img
      key={idx}
      src={media}
      alt={`${post.title}-${idx}`}
      className="w-full flex-shrink-0 h-60 object-cover"
    />
  );
})}
          </div>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
            {post.images?.map((_, idx: number) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  idx === currentIndex ? "bg-white" : "bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <h2 className="text-2xl font-bold">{post.title}</h2>
          <p className="text-gray-700">{post.description}</p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span>📅 {new Date(post.createdAt).toLocaleDateString()}</span>
            <span>📍 {post.location || "No Location"}</span>
            <span className="flex items-center gap-1">
              <UsersIcon className="w-4 h-4" />
              {post.interestedCandidate?.length || 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-500" />
              {post.likes?.length || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {post.comments?.length || 0}
            </span>
          </div>

          {/* Comments Section */}
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Comments</h3>
            {post.comments?.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {post.comments.map((c: any, idx: number) => (
                  <div key={idx} className="p-2 bg-gray-100 rounded">
                    <p className="text-sm font-medium">{c.userName}</p>
                    <p className="text-sm">{c.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No comments yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailCard;