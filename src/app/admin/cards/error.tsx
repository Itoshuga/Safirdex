"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function CardsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="grid min-h-80 place-items-center rounded-xl border border-destructive/20 bg-destructive/5 text-center"><div><AlertTriangle className="mx-auto mb-3 size-8 text-destructive" /><h2 className="font-heading text-xl font-semibold">Cards could not be loaded</h2><p className="mt-1 mb-4 text-sm text-muted-foreground">Check the Firebase connection and try again.</p><Button onClick={reset}><RefreshCw /> Try again</Button></div></div>;
}
