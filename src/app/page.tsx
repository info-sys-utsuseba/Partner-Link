import { Suspense } from "react";
import { ChatView } from "./ChatView";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-black text-sm text-zinc-500">
          読み込み中...
        </div>
      }
    >
      <ChatView />
    </Suspense>
  );
}
