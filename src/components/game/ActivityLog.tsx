"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LogEntry } from "@/types/game";
import { cn } from "@/lib/utils";

const VARIANT_CLASS: Record<LogEntry["variant"], string> = {
  system: "text-muted-foreground",
  info: "text-foreground",
  success: "text-devops",
  danger: "text-hacker",
  vote: "text-accent-foreground",
};

export function ActivityLog({ log }: { log: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log.length]);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-terminal">
      <p className="border-b border-border/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        activity log
      </p>
      <ScrollArea className="h-40 px-3 pb-3">
        <div className="flex flex-col gap-1 font-mono text-xs">
          {log.map((entry) => (
            <p key={entry.id} className={cn(VARIANT_CLASS[entry.variant])}>
              <span className="text-muted-foreground">
                [{new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}]
              </span>{" "}
              {entry.message}
            </p>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
