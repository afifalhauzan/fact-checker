"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { 
  Copy, Check, Facebook, Twitter, 
  Instagram, MessageCircle, Send, Share2, 
  Link
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  title?: string;
}

export function ShareModal({ isOpen, onClose, shareUrl, title = "Share" }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      inputRef.current?.select();
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const socialButtons = [
    { id: "whatsapp", icon: MessageCircle, color: "hover:bg-green-50 hover:text-green-600 hover:border-green-200", url: `https://wa.me/?text=${encodeURIComponent(shareUrl)}` },
    { id: "telegram", icon: Send, color: "hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200", url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}` },
    { id: "twitter", icon: Twitter, color: "hover:bg-sky-50 hover:text-sky-400 hover:border-sky-200", url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}` },
    { id: "facebook", icon: Facebook, color: "hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} showCloseButton={true}>
      <div className="space-y-8 py-6">
        {/* Social Grid */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Bagikan melalui</p>
          <div className="grid grid-cols-4 gap-4">
            {socialButtons.map((button) => (
              <a
                key={button.id}
                href={button.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center gap-2 group`}
              >
                <div className={`flex items-center justify-center w-12 h-12 rounded-2xl border border-border bg-card transition-all duration-200 group-hover:shadow-sm group-active:scale-95 ${button.color}`}>
                  <button.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground capitalize transition-colors">
                  {button.id}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Copy Link Section */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Atau salin link</p>
          <div className="relative flex items-center group">
            <div className="absolute left-3 text-muted-foreground group-focus-within:text-primary transition-colors">
              <Link className="h-4 w-4" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={shareUrl}
              readOnly
              onClick={() => inputRef.current?.select()}
              className="w-full pl-10 pr-28 py-3 text-sm rounded-xl border border-border bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            <div className="absolute right-1.5">
              <Button
                onClick={handleCopyLink}
                className={`h-9 px-4 rounded-lg transition-all duration-300 ${
                  copied ? "bg-green-600 hover:bg-green-600 scale-105" : "bg-primary"
                }`}
                size="sm"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={copied ? "check" : "copy"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <><Check className="h-3.5 w-3.5" /> <span className="text-xs">Tersalin</span></>
                    ) : (
                      <><Copy className="h-3.5 w-3.5" /> <span className="text-xs">Salin</span></>
                    )}
                  </motion.div>
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}