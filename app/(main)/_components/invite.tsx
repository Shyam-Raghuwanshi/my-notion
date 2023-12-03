"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  PopoverTrigger,
  Popover,
  PopoverContent,
} from "@/components/ui/popover";
import { useOrigin } from "@/hooks/use-origin";
import { Button } from "@/components/ui/button";

interface InviteProps {
  Id: Id<"documents">;
}

export const Invite = ({ Id }: InviteProps) => {
  const origin = useOrigin();

  const [copied, setCopied] = useState(false);

  const url = Id && `${origin}/collab/${Id}`;

  const onCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost">
          Invite
          <Share2 className="text-sky-500 w-4 h-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end" alignOffset={8} forceMount>
        <div className="space-y-4">
          <div className="flex items-center gap-x-2">
            <Share2 className="text-sky-500 animate-pulse h-4 w-4" />
            <p className="text-xs font-medium text-sky-500">
              Invite people for collab
            </p>
          </div>
          <div className="flex items-center">
            <input
              className="flex-1 px-2 text-xs border rounded-l-md h-8 bg-muted truncate"
              value={url}
              disabled
            />
            <Button
              onClick={onCopy}
              disabled={copied}
              className="h-8 rounded-l-none"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
