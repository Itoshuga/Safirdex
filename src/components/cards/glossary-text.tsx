"use client";

import { useTranslations } from "next-intl";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { tokenizeGlossaryContent } from "@/lib/glossary/references";
import type { CardDetailItem } from "@/features/cards/types";

export function GlossaryText({
  content,
  glossary,
}: {
  content: string;
  glossary: CardDetailItem["glossary"];
}) {
  const t = useTranslations("Cards.detail");

  return (
    <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
      {tokenizeGlossaryContent(content).map((token, index) => {
        if (token.type === "text") return token.value;
        const entry = glossary[token.key];
        if (!entry) return token.raw;

        return (
          <Tooltip key={`${token.key}-${index}`}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  className="inline rounded-sm font-semibold text-safir underline decoration-safir/35 decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  aria-label={t("glossaryDefinition", { term: entry.label })}
                />
              }
            >
              {entry.label}
            </TooltipTrigger>
            <TooltipContent className="block max-w-72 px-3 py-2 text-left">
              <span className="block font-semibold">{entry.label}</span>
              <span className="mt-1 block font-normal leading-5 opacity-85">{entry.definition}</span>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </p>
  );
}
