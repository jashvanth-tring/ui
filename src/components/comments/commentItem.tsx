import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  updateRemark,
  deleteRemark,
} from "../../store/services/comments";
import CommentBox from "./commentBox";
import { getAvatarSvg } from "../../utils/avatar";
import "./commentItem.css";

interface Comment {
  id: number;
  user_id?: number;
  comment: string;
  created_at: string;
  updated_at?: string;
  user: {
    firstName: string;
    lastName: string;
  };
  replies?: Comment[];
}

interface Props {
  taskId: string;
  comment: Comment;
  candidateId?: number; // ✅ optional candidateId for future use
  requierementId?: number; // ✅ optional requirementId for future use
  refresh: () => void;
}

// ✅ helper — strip HTML tags to get plain text
const stripHtml = (html: string) => html?.replace(/<[^>]*>/g, "") ?? "";

export default function CommentItem({ comment, refresh, taskId }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLDivElement>(null); // ✅ contentEditable ref for edit
  const currentUser = useSelector((state: any) => state.authSelector.user);

  const MAX_CHARS = 120;
  const plainText = stripHtml(comment.comment);
  const isLong = plainText.length > MAX_CHARS;
  const isOwner = Number(comment.user_id) === Number(currentUser?.id);

  // ✅ set edit box content when editing starts
  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.innerHTML = comment.comment; // ✅ load HTML into editor
      editRef.current.focus();
    }
  }, [editing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpdate = async () => {
    try {
      const updatedHtml = editRef.current?.innerHTML || "";
      await updateRemark(comment.id, { task_id: taskId, comment: updatedHtml }); // ✅ save HTML
      setEditing(false);
      refresh();
    } catch (err) {
      console.error("Update error", err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRemark(comment.id, taskId);
      refresh();
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  return (
    <div className="comment-container">
      {/* HEADER */}
      <div className="comment-header">
        <div className="comment-left">
          <div
            className="avatar"
            dangerouslySetInnerHTML={{
              __html: getAvatarSvg(comment.user?.firstName, comment.user?.lastName),
            }}
          />
          <div className="comment-user-info">
            <span className="comment-username">
              {comment.user?.firstName ?? "Unknown"} {comment.user?.lastName ?? ""}
            </span>
            <span className="comment-time">
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* MENU — owner only */}
        {isOwner && (
          <div className="menu-wrapper" ref={menuRef}>
            <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}>
              ⋮
            </button>
            {menuOpen && (
              <div className="menu-dropdown">
                <div
                  className="menu-item"
                  onClick={() => { setEditing(true); setMenuOpen(false); }}
                >
                  Edit
                </div>
                <div className="menu-item delete" onClick={handleDelete}>
                  Delete
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTENT */}
      {editing ? (
        <div className="edit-section">
          {/* ✅ contentEditable div instead of input — preserves HTML formatting */}
          <div
            ref={editRef}
            contentEditable
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "8px 10px",
              minHeight: "60px",
              fontSize: "14px",
              lineHeight: "1.6",
              outline: "none",
              color: "#111827",
              flex: 1,
            }}
          />
          <div style={{ gap: "12px", display: "flex", marginTop: "6px" }}>
            <button
              onClick={() => setEditing(false)}
              style={{ background: "none", border: "none", color: "grey", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              style={{ background: "none", border: "none", color: "#374151", fontWeight: 600, cursor: "pointer" }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="comment-content" style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "#111827" }}>

          {isLong && !expanded ? (
  <>
    <span>{plainText.slice(0, MAX_CHARS)}</span>
    <span className="read-more-inline" onClick={() => setExpanded(true)}>
      ... Read more
    </span>
  </>
) : (
  <span dangerouslySetInnerHTML={{ __html: comment.comment }} />
)}

          {/* edited label */}
          {comment.updated_at &&
            new Date(comment.updated_at).getTime() !== new Date(comment.created_at).getTime() && (
              <span style={{ fontSize: "10px", color: "#9ca3af", marginLeft: "6px", fontStyle: "italic" }}>
                (edited)
              </span>
            )}
        </div>
      )}

      {/* ACTIONS */}
      <div className="comment-actions">
        <button className="reply-button" onClick={() => setShowReply(!showReply)}>
          Reply
        </button>
        {comment.replies && comment.replies.length > 0 && (
          <button
            className="reply-button"
            onClick={() => { setShowReplies(!showReplies); setShowReply(false); }}
          >
            {showReplies ? "Hide Replies" : `Show Replies (${comment.replies.length})`}
          </button>
        )}
      </div>

      {/* REPLY BOX */}
      {showReply && (
        <div className="reply-box">
          <CommentBox taskId={taskId} parentId={comment.id} refresh={refresh} />
          {/* <button
            onClick={() => setShowReply(false)}
            style={{ color: "red", background: "none", border: "none", cursor: "pointer", marginTop: "9px", paddingLeft: "9px" }}
          >
            X
          </button> */}
        </div>
      )}

      {/* REPLIES */}
      {showReplies && (
        <div className="replies-container">
          {comment.replies?.map((r: Comment) => (
            <CommentItem key={r.id} comment={r} refresh={refresh} taskId={taskId} />
          ))}
        </div>
      )}

      {!showReplies && (
        <hr style={{ width: "96%", marginLeft: "24px", marginTop: "10px" }} />
      )}
    </div>
  );
}