// ═══════════════════════════════════════════════════════════════
// CommentThread — Fil de commentaires collaboratifs
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CollaboratorAvatar } from './CollaboratorAvatar';
import type { DocumentComment } from '@/types/documents';

// ─── Types locaux ─────────────────────────────────────────────

type CommentFilter = 'all' | 'open' | 'resolved' | 'mine';

interface CommentThreadProps {
  comments: DocumentComment[];
  onResolve: (id: string) => void;
  onReply: (parentId: string, content: string) => void;
  filter: CommentFilter;
  currentUserId: string;
}

// ─── Utilitaires ──────────────────────────────────────────────

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD === 1) return 'hier';
  return `il y a ${diffD}j`;
}

// ─── Composant commentaire unique (récursif pour replies) ─────

interface CommentItemProps {
  comment: DocumentComment;
  onResolve: (id: string) => void;
  onReply: (parentId: string, content: string) => void;
  isReply?: boolean;
}

function CommentItem({ comment, onResolve, onReply, isReply = false }: CommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleSendReply = () => {
    const trimmed = replyContent.trim();
    if (!trimmed) return;
    onReply(comment.id, trimmed);
    setReplyContent('');
    setReplyOpen(false);
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-2',
        comment.isResolved && 'opacity-50'
      )}
    >
      {/* En-tête commentaire */}
      <div className="flex items-center gap-2">
        <CollaboratorAvatar
          user={comment.author}
          color="#6366f1"
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-foreground">
              {comment.author.prenom} {comment.author.nom}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatTimestamp(comment.createdAt)}
            </span>
            {comment.isResolved && (
              <span className="text-[10px] bg-success/15 text-success border border-success/30 px-1.5 py-0.5 rounded font-medium">
                Résolu
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Texte surligné */}
      {comment.highlightedText && (
        <span className="bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-100 text-xs rounded px-1 italic self-start">
          « {comment.highlightedText} »
        </span>
      )}

      {/* Contenu */}
      <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          onClick={() => setReplyOpen(v => !v)}
        >
          Répondre
        </Button>
        {!comment.isResolved && !isReply && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-success"
            onClick={() => onResolve(comment.id)}
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Résoudre
          </Button>
        )}
      </div>

      {/* Zone de réponse */}
      {replyOpen && (
        <div className="flex items-center gap-2 mt-1">
          <Input
            placeholder="Votre réponse…"
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSendReply(); }}
            className="h-7 text-xs flex-1"
          />
          <Button
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={handleSendReply}
            disabled={!replyContent.trim()}
          >
            Envoyer
          </Button>
        </div>
      )}

      {/* Replies indentées */}
      {comment.replies.length > 0 && (
        <div className="ml-8 border-l-2 border-border pl-3 flex flex-col gap-3 mt-1">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onResolve={onResolve}
              onReply={onReply}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────

export function CommentThread({
  comments,
  onResolve,
  onReply,
  filter,
  currentUserId,
}: CommentThreadProps) {
  const filtered = comments.filter(c => {
    if (filter === 'open') return !c.isResolved;
    if (filter === 'resolved') return c.isResolved;
    if (filter === 'mine') return c.author.id === currentUserId;
    return true; // 'all'
  });

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Aucun commentaire à afficher.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {filtered.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onResolve={onResolve}
          onReply={onReply}
        />
      ))}
    </div>
  );
}
