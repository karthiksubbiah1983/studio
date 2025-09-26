
"use client";

import { useEffect } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Builder } from "@/components/builder/builder";

type Props = {
    params: {
        formId: string;
    }
}
export default function BuilderPage({ params: { formId } }: Props) {
    const { state, dispatch, sections } = useBuilder();

    useEffect(() => {
        // Set the active form based on the URL parameter
        if (formId && state.activeFormId !== formId) {
            dispatch({ type: "SET_ACTIVE_FORM", payload: { formId } });
        }
    }, [formId, state.activeFormId, dispatch]);
    
    // Show a loading state if the active form isn't ready yet or sections are not loaded.
    if (state.activeFormId !== formId || sections.length === 0) {
        // Add a check to see if there are any forms at all, if not, it's probably the initial load.
        const activeForm = state.forms.find(f => f.id === formId);
        if (!activeForm || activeForm.versions[0].sections.length === 0) {
             return (
                 <div className="flex justify-center items-center h-screen">
                    <p>Loading Form...</p>
                </div>
            )
        }
    }

    return (
        <main className="flex flex-col h-screen w-full">
            <Builder />
        </main>
    );
}
