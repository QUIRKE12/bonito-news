"use client";

import { useState } from "react";
import { Twitter, Facebook, Mail, Send, MessageCircle, Link2, Check } from "lucide-react";

type ShareButtonsProps = {
  url: string;
  title: string;
  className?: string;
};

const platforms = [
  {
    name: "X",
    icon: Twitter,
    bg: "bg-black hover:bg-neutral-800",
    href: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: "Facebook",
    icon: Facebook,
    bg: "bg-[#1877F2] hover:bg-[#1465CC]",
    href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "Email",
    icon: Mail,
    bg: "bg-[#D93025] hover:bg-[#B92A20]",
    href: (url: string, title: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
  {
    name: "Telegram",
    icon: Send,
    bg: "bg-[#26A5E4] hover:bg-[#1E8FC7]",
    href: (url: string, title: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: "WhatsApp",
    icon: MessageCircle,
    bg: "bg-[#25D366] hover:bg-[#1FB855]",
    href: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
];

export default function ShareButtons({ url, title, className = "" }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard API unavailable; silently ignore
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label="Share this article">
      {platforms.map(({ name, icon: Icon, bg, href }) => (
        <a
          key={name}
          href={href(url, title)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${name}`}
          title={`Share on ${name}`}
          className={`flex h-8 w-8 items-center justify-center rounded-sm text-white transition-colors ${bg}`}
        >
          <Icon size={16} strokeWidth={2} />
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        title={copied ? "Copied!" : "Copy link"}
        className="flex h-8 w-8 items-center justify-center rounded-sm bg-charcoal text-white transition-colors hover:bg-ink"
      >
        {copied ? <Check size={16} strokeWidth={2} /> : <Link2 size={16} strokeWidth={2} />}
      </button>
    </div>
  );
}
