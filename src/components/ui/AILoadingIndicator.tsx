"use client";

interface AILoadingIndicatorProps {
  message?: string;
  subMessage?: string;
  className?: string;
}

export const AILoadingIndicator = ({ 
  message = "AI IS ANALYZING...", 
  subMessage = "データを解析・処理しています",
  className = ""
}: AILoadingIndicatorProps) => {
  return (
    <div className={`h-44 w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-amber-200/50 dark:border-amber-700/30 overflow-hidden relative ${className}`}>
      {/* Subtle glowing background pulse */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/10 to-amber-500/5 animate-pulse"></div>
      
      {/* Siri-like Wave Indicator */}
      <div className="flex items-center gap-1.5 mb-6 relative z-10">
        <div className="w-1.5 h-4 bg-amber-400 rounded-full anim-siri-wave" style={{ animationDelay: '0.0s' }}></div>
        <div className="w-1.5 h-8 bg-orange-400 rounded-full anim-siri-wave" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-1.5 h-12 bg-amber-500 rounded-full anim-siri-wave" style={{ animationDelay: '0.4s' }}></div>
        <div className="w-1.5 h-8 bg-orange-500 rounded-full anim-siri-wave" style={{ animationDelay: '0.6s' }}></div>
        <div className="w-1.5 h-4 bg-amber-400 rounded-full anim-siri-wave" style={{ animationDelay: '0.8s' }}></div>
      </div>
      
      <p className="text-sm font-bold text-amber-600 dark:text-amber-400 font-poppins tracking-widest animate-pulse relative z-10">
        {message}
      </p>
      <p className="text-xs text-slate-500 mt-2 relative z-10">
        {subMessage}
      </p>
    </div>
  );
};
