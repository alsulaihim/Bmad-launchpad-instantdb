import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
      <div className="relative h-7 w-7 sm:h-8 sm:w-8">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-slate-300 to-orange-400 rounded-lg rotate-6" />
        <div className="absolute inset-0.5 bg-background rounded-lg" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
        </div>
      </div>
      <span className="text-base sm:text-lg font-semibold">
        Vibe Coding Launchpad
      </span>
    </Link>
  );
}
