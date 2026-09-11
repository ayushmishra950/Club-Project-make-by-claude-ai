import { useState } from 'react';
import { Send } from 'lucide-react';
import {formatBackendDateTime} from "@/service/global";

function CommentItem({
  comment,
  depth = 0,
  handleLikeAndUnLikeComment,
  handleAddCommentReply,
}: {
  comment: any;
  depth?: number;
  handleLikeAndUnLikeComment: (commentId: string) => Promise<void>;
  handleAddCommentReply: (parentCommentId: string, text: string) => Promise<void>;
}) {
  const user = JSON.parse(localStorage.getItem("member.user"));
  const [replying, setReplying] = useState(false); // show reply input
  const [replyText, setReplyText] = useState(""); // input text

  const submitReply = async () => {
    if (!replyText.trim()) return;
    await handleAddCommentReply(comment._id, replyText);
    setReplyText("");
    setReplying(false);
  };
  
  return (
    <div className={`${depth > 0 ? "ml-10" : ""} mb-2`}>
      <div className="flex gap-2.5">
        <img
          src={comment.user.profileImage}
          alt={comment.user.name || comment.user.fullName}
          className="h-8 w-8 rounded-full object-cover shrink-0 mt-0.5"
        />
        <div className="flex-1 min-h-0">
          {/* Comment text */}
          <div className="bg-muted rounded-2xl px-3.5 py-2">
            <p className="font-semibold text-xs text-foreground">
              {comment.user.name || comment.user.fullName}
            </p>
            <p className="text-sm text-foreground">{comment.text}</p>
          </div>

          {/* Only top-level comments have Like / Reply buttons */}
          {depth === 0 && (
            <div className="flex items-center gap-3 mt-1 px-2">
              <span className="text-xs text-muted-foreground">
                {formatBackendDateTime(comment.createdAt)}
              </span>

              <button
                onClick={() => handleLikeAndUnLikeComment(comment._id)}
                className={`text-xs font-semibold ${
                  comment.likes?.includes(user?._id)
                    ? "text-red-500"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {comment?.likes?.length || 0} Like
              </button>

              {/* Reply button and input */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setReplying(!replying)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  {comment?.replies?.length} Reply
                </button>

                {replying && (
                  <div className="flex gap-1 items-center">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Reply..."
                      className="border rounded px-1 py-0.5 text-xs w-36"
                    />
                    <button
                      onClick={submitReply}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Send
                    </button>
                    <button
                      onClick={() => setReplying(false)}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Show nested replies ONLY when top-level Reply clicked */}
          {replying && comment.replies && comment.replies.length > 0 && (
            <div className="mt-1">
              {comment.replies.map((r) => (
                <CommentItem
                  key={r._id}
                  comment={r}
                  depth={depth + 1}
                  handleLikeAndUnLikeComment={handleLikeAndUnLikeComment}
                  handleAddCommentReply={handleAddCommentReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




export function CommentSection({ comments, handleAddCommentReply, newComment, setNewComment,onSubmit, handleLikeAndUnLikeComment }) {
  const user = JSON.parse(localStorage.getItem("member.user"));
  return (
  <div className="border-t border-border max-h-60 overflow-y-auto relative">

  <div className="sticky top-0 z-10 bg-card px-4 py-3">
    <div className="flex items-center gap-2.5">
      <img
        src={user.profileImage || "https://via.placeholder.com/40"}
        alt=""
        className="h-8 w-8 rounded-full object-cover shrink-0"
      />
      <div className="flex-1 flex items-center bg-muted rounded-full px-3 py-1.5">
        <input
          type="text"
          placeholder="Write a comment..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={(e)=>{if(e.key === "Enter"){e.preventDefault(); onSubmit()}}}
          className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
        />
        <button
          className="text-primary hover:opacity-80 transition-opacity ml-2"
          onClick={() => onSubmit()}
          disabled={!newComment || newComment?.trim() === ""}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>

  {/* 🔹 Comments List */}
  <div className="px-4 pb-3 space-y-3">
    {comments.map(c => (
      <CommentItem key={c.id} comment={c} handleLikeAndUnLikeComment={handleLikeAndUnLikeComment} handleAddCommentReply={handleAddCommentReply} />
    ))}
  </div>

</div>
  );
}
