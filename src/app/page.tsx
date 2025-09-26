
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

  // The main loading screen is now in the BuilderProvider,
  // so this component doesn't need to render its own.
  // It will just wait for the provider to finish and the effect to redirect.
  return null;
}
