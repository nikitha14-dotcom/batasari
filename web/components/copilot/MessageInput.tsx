"use client";

import { useState, useRef, memo, type KeyboardEvent } from "react";

export interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const canSend = text.trim().length > 0 && !disabled;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="copilot-input">
      <input
        ref={inputRef}
        type="text"
        placeholder="Ask anything..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Ask the AI advisor"
        autoComplete="off"
      />
      <button
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
        title="Send"
        style={{ opacity: canSend ? 1 : 0.5, cursor: canSend ? "pointer" : "not-allowed" }}
      >
        ↑
      </button>
    </div>
  );
}

export default memo(MessageInput);

