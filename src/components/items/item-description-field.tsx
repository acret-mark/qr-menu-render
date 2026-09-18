"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateItemDescription } from "@/lib/items/actions";

export type ItemDescriptionFieldHandle = {
  triggerAutoDraft: () => void;
};

// Ported from qr-menu-dev's src/components/items/item-description-field.tsx:
// auto-draft on item-name blur (never overwriting existing text), a
// keyword-guided regenerate, accept/decline of the AI draft, an
// "AI-drafted" badge once accepted, and daily-limit messaging.
export const ItemDescriptionField = forwardRef<
  ItemDescriptionFieldHandle,
  {
    itemId?: string;
    name: string;
    initialDescription: string;
    initialDescriptionSource: "ai_generated" | "manual" | null;
    initialKeywords: string[] | null;
    onDescriptionChange: (description: string) => void;
    onAcceptedDraft: (keywords: string[]) => void;
  }
>(function ItemDescriptionField(
  {
    itemId,
    name,
    initialDescription,
    initialDescriptionSource,
    initialKeywords,
    onDescriptionChange,
    onAcceptedDraft,
  },
  ref
) {
  const [description, setDescription] = useState(initialDescription);
  const [mode, setMode] = useState<"plain" | "generating" | "draft">("plain");
  const [draftText, setDraftText] = useState<string | null>(null);
  const [keywords, setKeywords] = useState((initialKeywords ?? []).join(", "));
  const [keywordsExpanded, setKeywordsExpanded] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [wasAiGenerated, setWasAiGenerated] = useState(
    initialDescriptionSource === "ai_generated"
  );

  async function runGeneration() {
    setMode("generating");
    setStatusMessage(null);

    const result = await generateItemDescription({
      itemId,
      name,
      keywords: keywords.trim() || undefined,
    });

    if (!result.ok) {
      setMode("plain");
      if (result.reason === "limit-reached") {
        setStatusMessage(
          "You've reached today's limit for regenerating this item's description — write your own below."
        );
      }
      // A plain "generation-failed" result falls back silently to the usable
      // plain field already showing — no error message required.
      return;
    }

    setDraftText(result.text);
    setMode("draft");
  }

  useImperativeHandle(ref, () => ({
    triggerAutoDraft: () => {
      if (description.trim() || mode !== "plain") {
        return; // never auto-overwrite existing text
      }
      if (!name.trim()) {
        return;
      }
      runGeneration();
    },
  }));

  function handleAccept() {
    if (draftText === null) return;
    setDescription(draftText);
    onDescriptionChange(draftText);
    const keywordList = keywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    onAcceptedDraft(keywordList);
    setWasAiGenerated(true);
    setMode("plain");
    setDraftText(null);
  }

  function handleDecline() {
    setDescription("");
    onDescriptionChange("");
    setWasAiGenerated(false);
    setMode("plain");
    setDraftText(null);
  }

  function handleManualChange(value: string) {
    setDescription(value);
    onDescriptionChange(value);
    setWasAiGenerated(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor="item-description" className="text-sm font-medium">
          Description
        </label>
        {wasAiGenerated && mode === "plain" && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold text-primary">
            AI-drafted
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setKeywordsExpanded((expanded) => !expanded)}
        className="self-start text-xs font-medium text-accent"
      >
        + Add keywords for a more specific description
      </button>

      {keywordsExpanded && (
        <div className="flex gap-2">
          <input
            type="text"
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
            placeholder="e.g. spicy, family recipe, grilled"
            className="h-11 flex-1 rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!keywords.trim() || mode === "generating"}
            onClick={runGeneration}
          >
            Regenerate
          </Button>
        </div>
      )}

      {mode === "generating" && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles size={14} />
          Generating description…
        </p>
      )}

      {mode === "draft" && draftText !== null && (
        <div className="flex flex-col gap-2">
          <textarea
            readOnly
            value={draftText}
            rows={3}
            className="min-h-20 rounded-lg border border-border bg-muted px-3.5 py-2.5 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleDecline}>
              Decline — write my own
            </Button>
            <Button type="button" size="sm" onClick={handleAccept}>
              Accept
            </Button>
          </div>
        </div>
      )}

      {mode === "plain" && (
        <textarea
          id="item-description"
          value={description}
          onChange={(event) => handleManualChange(event.target.value)}
          rows={3}
          placeholder="Optional — a short, appetizing description"
          className="min-h-20 rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      )}

      {statusMessage && <p className="text-xs text-muted-foreground">{statusMessage}</p>}
    </div>
  );
});
