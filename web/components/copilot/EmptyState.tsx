"use client";

import { memo } from "react";

const DEFAULT_DESCRIPTION =
  "Ask questions about planning your move and settling into an Indian city.";

function EmptyState({ description = DEFAULT_DESCRIPTION }: { description?: string }) {
  return (
    <div className="copilot-placeholder">
      <div className="copilot-icon">✦</div>
      <h3>Ask your AI advisor</h3>
      <p>{description}</p>
    </div>
  );
}

export default memo(EmptyState);

