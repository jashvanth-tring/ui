import { useState, useRef, useEffect } from "react";
import { createRemark, replyToRemark } from "../../store/services/comments";
import "./commentBox.css";
import { getAvatarSvg } from "../../utils/avatar";
import { useSelector } from "react-redux";

interface Props {
  taskId: string;
  candidateId?: number; // ✅ optional candidateId for future use
  parentId?: number;
  refresh: () => void;
}

const ToolbarButton = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    style={{
      background: "none", border: "none", cursor: "pointer",
      padding: "4px 6px", borderRadius: "4px", color: "#374151",
      fontSize: "13px", fontWeight: 500, display: "inline-flex",
      alignItems: "center", justifyContent: "center",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
  >
    {children}
  </button>
);

const Divider = () => (
  <span style={{ width: "1px", height: "18px", background: "#e5e7eb", margin: "0 4px", display: "inline-block" }} />
);

// CHANGED: curated emoji list for the picker instead of a random pick
const EMOJI_LIST = [
  "😊", "😂", "😍", "😢", "😎", "🤔", "😅", "🥳",
  "👍", "👎", "👏", "🙌", "🤝", "🙏", "👋", "✌️",
  "❤️", "🔥", "⭐", "✅", "❌", "⚡", "💡", "🎉",
  "🚀", "💬", "📌", "🗓️", "📝", "🔗", "💼", "🏆",
];

export default function CommentBox({ taskId, parentId, refresh }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  // CHANGED: controls emoji picker visibility
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  // CHANGED: ref to detect clicks outside the emoji picker and close it
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const currentUser = useSelector((state: any) => state.authSelector.user);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    syncText();
  };

  const syncText = () => setText(editorRef.current?.innerText || "");

  const submit = async () => {
    const content = editorRef.current?.innerHTML || "";
    const plainText = editorRef.current?.innerText?.trim() || "";
    if (!plainText) return;
    setLoading(true);
    try {
      if (parentId) {
        await replyToRemark({ task_id: taskId, parent_id: parentId, comment: content });
      } else {
        await createRemark({ task_id: taskId, comment: content, parent_id: null });
      }
      if (editorRef.current) editorRef.current.innerHTML = "";
      setText("");
      setFocused(false);
      setShowEmojiPicker(false); // CHANGED: close picker on submit
      refresh();
    } catch (err) {
      console.error("Failed to submit comment", err);
    } finally {
      setLoading(false);
    }
    console.log("📤 FINAL taskId before API:", taskId, typeof taskId);
  };

  const handleCancel = () => {
    if (editorRef.current) editorRef.current.innerHTML = "";
    setText("");
    setFocused(false);
    setShowEmojiPicker(false); // CHANGED: close picker on cancel
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  };

  // CHANGED: insert selected emoji at cursor and close the picker
  const handleEmojiSelect = (emoji: string) => {
    exec("insertText", emoji);
    setShowEmojiPicker(false);
  };

  // CHANGED: close emoji picker when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasContent = text.trim().length > 0;

  return (
    <div className="comment-box">
      <div
        className="avatar"
        dangerouslySetInnerHTML={{
          __html: getAvatarSvg(currentUser?.firstName, currentUser?.lastName),
        }}
      />

      <div style={{ flex: 1 }}>
        {!focused ? (
          <input
            placeholder={parentId ? "Write a reply..." : "Write a comment..."}
            className="input-box"
            style={{ borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, width: "100%" }}
            onFocus={() => setFocused(true)}
            readOnly
          />
        ) : (
          <div style={{
            border: "1px solid #e5e7eb", borderRadius: "10px",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            {/* Toolbar */}
            <div style={{
              display: "flex", alignItems: "center",
              padding: "6px 10px", borderBottom: "1px solid #e5e7eb",
              flexWrap: "wrap", gap: "2px",
            }}>
              <ToolbarButton onClick={() => exec("bold")} title="Bold"><strong>B</strong></ToolbarButton>
              <ToolbarButton onClick={() => exec("italic")} title="Italic"><em>I</em></ToolbarButton>
              <ToolbarButton onClick={() => exec("underline")} title="Underline">
                <span style={{ textDecoration: "underline" }}>U</span>
              </ToolbarButton>
              <ToolbarButton onClick={() => exec("strikeThrough")} title="Strikethrough">
                <span style={{ textDecoration: "line-through" }}>S</span>
              </ToolbarButton>
              <Divider />
              <ToolbarButton onClick={() => exec("formatBlock", "pre")} title="Code">{"<>"}</ToolbarButton>
              <ToolbarButton onClick={insertLink} title="Link">🔗</ToolbarButton>
              <Divider />
              <ToolbarButton onClick={() => exec("formatBlock", "blockquote")} title="Quote">❝❞</ToolbarButton>
              <ToolbarButton onClick={() => exec("insertUnorderedList")} title="Bullet List">☰</ToolbarButton>
              <ToolbarButton onClick={() => exec("insertOrderedList")} title="Ordered List">≡</ToolbarButton>
              <Divider />
              <ToolbarButton
                onClick={() => {
                  const mention = prompt("Enter username to mention:");
                  if (mention) exec("insertText", `@${mention} `);
                }}
                title="Mention"
              >
                @
              </ToolbarButton>

              {/* CHANGED: emoji button now toggles a picker popup instead of inserting randomly */}
              <div style={{ position: "relative" }} ref={emojiPickerRef}>
                <ToolbarButton onClick={() => setShowEmojiPicker((prev) => !prev)} title="Emoji">
                  🙂
                </ToolbarButton>

                {/* CHANGED: emoji picker popup grid */}
                {showEmojiPicker && (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    zIndex: 100,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "10px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    display: "grid",
                    gridTemplateColumns: "repeat(8, 1fr)",
                    gap: "4px",
                    width: "305px",
                  }}>
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleEmojiSelect(emoji)}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          fontSize: "18px", padding: "4px", borderRadius: "6px", lineHeight: 1,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Editor */}
            <div
              ref={editorRef}
              contentEditable
              onInput={syncText}
              autoFocus
              data-placeholder={parentId ? "Write a reply..." : "Write a comment..."}
              style={{
                minHeight: "90px", padding: "12px 14px",
                outline: "none", fontSize: "14px",
                color: "#111827", lineHeight: "1.6",
              }}
              className="comment-editor"
            />

            {/* Footer */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px", borderTop: "1px solid #f3f4f6",
              background: "#fafafa",
            }}>
              <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                Supports <strong>**bold**</strong>, <em>*italic*</em>, __underline__
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleCancel}
                  style={{
                    background: "none", border: "1px solid #e5e7eb",
                    borderRadius: "6px", padding: "7px 14px",
                    fontSize: "13px", fontWeight: 500,
                    cursor: "pointer", color: "#6b7280",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={!hasContent || loading}
                  style={{
                    background: hasContent && !loading ? "#374151" : "#9ca3af",
                    color: "#fff", border: "none", borderRadius: "6px",
                    padding: "7px 16px", fontSize: "13px", fontWeight: 600,
                    cursor: !hasContent || loading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: "6px",
                    transition: "background 0.2s",
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: "11px", height: "11px",
                        border: "2px solid #fff", borderTopColor: "transparent",
                        borderRadius: "50%", display: "inline-block",
                        animation: "spin 0.6s linear infinite",
                      }} />
                      Posting...
                    </>
                  ) : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}