'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CommunityComment } from '@/lib/types';

type CommentWithAuthor = CommunityComment & { author: { full_name: string } | null };

function CommentForm({
  postId,
  parentCommentId,
  onDone,
}: {
  postId: string;
  parentCommentId: string | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    await fetch('/api/community/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, parent_comment_id: parentCommentId, body }),
    });
    setSubmitting(false);
    setBody('');
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
      <input
        className="input-field"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a reply…"
      />
      <button type="submit" disabled={submitting} className="btn-secondary shrink-0 text-sm">
        Reply
      </button>
    </form>
  );
}

function CommentNode({
  comment,
  childrenByParent,
  postId,
}: {
  comment: CommentWithAuthor;
  childrenByParent: Map<string | null, CommentWithAuthor[]>;
  postId: string;
}) {
  const [replying, setReplying] = useState(false);
  const replies = childrenByParent.get(comment.id) ?? [];

  return (
    <div className="border-l-2 border-sage-100 pl-4">
      <p className="text-sm text-sage-800">{comment.body}</p>
      <div className="mt-1 flex items-center gap-3 text-xs text-sage-400">
        <span>{comment.author?.full_name ?? 'A parent'}</span>
        <span>{new Date(comment.created_at).toLocaleDateString()}</span>
        <button onClick={() => setReplying((r) => !r)} className="font-medium text-sky-600 hover:underline">
          Reply
        </button>
      </div>

      {replying && (
        <CommentForm postId={postId} parentCommentId={comment.id} onDone={() => setReplying(false)} />
      )}

      {replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map((reply) => (
            <CommentNode key={reply.id} comment={reply} childrenByParent={childrenByParent} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentThread({
  postId,
  comments,
}: {
  postId: string;
  comments: CommentWithAuthor[];
}) {
  const childrenByParent = new Map<string | null, CommentWithAuthor[]>();
  for (const comment of comments) {
    const key = comment.parent_comment_id;
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key)!.push(comment);
  }

  const topLevel = childrenByParent.get(null) ?? [];

  return (
    <div className="card">
      <h3 className="text-base font-semibold text-sage-900">
        {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
      </h3>

      <div className="mt-3">
        <CommentForm postId={postId} parentCommentId={null} onDone={() => {}} />
      </div>

      <div className="mt-5 space-y-4">
        {topLevel.map((comment) => (
          <CommentNode key={comment.id} comment={comment} childrenByParent={childrenByParent} postId={postId} />
        ))}
      </div>
    </div>
  );
}
