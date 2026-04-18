"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut, Key } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";

interface AuthButtonProps {
  onLogoutClick?: () => void;
}

export function AuthButton({ onLogoutClick }: AuthButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { apiKey, logout } = useAuthStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!apiKey) {
    return null;
  }

  // Get truncated API key (first 4 and last 4 characters)
  const getTruncatedApiKey = (key: string): string => {
    if (key.length <= 8) return key;
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    if (onLogoutClick) {
      onLogoutClick();
    } else {
      logout();
    }
  };

  const truncatedKey = getTruncatedApiKey(apiKey);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Auth Status Button */}
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 px-3 hover:bg-accent rounded-lg transition-colors flex items-center gap-2"
      >
        {/* Key Icon with Badge */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Key size={16} className="text-primary" />
            </div>
            {/* <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-background" /> */}
          </div>
          {/* Status Text */}
          {/* <div className="hidden md:flex flex-col items-start text-left">
            <span className="text-xs text-muted-foreground leading-none">Akses✅</span>
          </div> */}
        </div>
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-50 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Status Header */}
          <div className="p-4 border-b border-border bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Key size={18} className="text-primary" />
                </div>
                {/* <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" /> */}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Terautentikasi</p>
                {/* <p className="text-xs text-muted-foreground break-all font-mono">{apiKey}</p> */}
              </div>
            </div>
          </div>

          {/* Logout Option */}
          <div className="p-1">
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
