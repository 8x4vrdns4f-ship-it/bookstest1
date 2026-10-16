import { Button } from "@/components/ui/button";
import { MessageSquareText } from "lucide-react";
import { openAssistant } from "@/components/dashboard/AssistantPanel";

// Settings shortcut into the dashboard-wide assistant (one assistant, opened from anywhere).
export default function SettingsAssistant(_props: { onApplied?: () => void }) {
  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
        <MessageSquareText size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-foreground leading-tight">Ask to change anything</h2>
        <p className="text-xs text-muted-foreground">Tell the assistant what you want and it sets it up for you.</p>
      </div>
      <Button size="sm" onClick={openAssistant} className="bg-primary text-primary-foreground hover:bg-primary/90">Open assistant</Button>
    </div>
  );
}
