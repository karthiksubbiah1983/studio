
"use client";

import { useBuilder } from "@/hooks/use-builder";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page now acts as a redirect to the default form builder.
export default function Home() {
  const { state } = useBuilder();
  const router = useRouter();

  useEffect(() => {
    // If there's an active form, go there. Otherwise, go to the first form.
    const formId = state.activeFormId || state.forms[0]?.id;
    if (formId) {
      router.replace(`/builder/${formId}`);
    }
    // If there are no forms, the useBuilder hook will create a default one,
    // and this effect will run again to redirect.
  }, [state.activeFormId, state.forms, router]);

  // Render a loading state while redirecting
  return (
    <main className="flex flex-col items-center justify-center w-full min-h-screen bg-background p-4 md:p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary">CoPilot</h1>
        <p className="text-muted-foreground mt-2">Loading your form builder...</p>
      </div>
    </main>
  );
}
