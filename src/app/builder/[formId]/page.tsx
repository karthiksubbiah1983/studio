
"use client";

import { useEffect, useState } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Builder } from "@/components/builder/builder";

type Props = {
    params: {
        formId: string;
    }
}
export default function BuilderPage({ params }: Props) {
    const { dispatch, state } = useBuilder();
    const { formId } = params;
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // This consolidated effect handles setting the active form and determining
        // when the component is ready to render.
        
        // 1. If the active form in the state doesn't match the URL, dispatch an action to sync it.
        if (formId && state.activeFormId !== formId) {
            dispatch({ type: 'SET_ACTIVE_FORM', payload: { formId } });
        }

        // 2. Check if the state is ready. The state is considered ready only when the
        // activeFormId in the global state matches the formId from the URL params.
        // This ensures we don't try to render with stale or incorrect data, especially on a hard refresh in a new tab.
        if (state.activeFormId === formId) {
            setIsReady(true);
        } else {
            // If they don't match (e.g., during the initial dispatch), ensure we are not in a ready state.
            setIsReady(false);
        }
    }, [formId, state.activeFormId, dispatch]);


    const form = state.forms.find(f => f.id === formId);

    // Only render the builder when the state is confirmed to be ready and the form data is available.
    if (!isReady || !form) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Loading Form...</p>
            </div>
        )
    }

    return (
        <main className="flex flex-col h-screen w-full">
            <Builder />
        </main>
    );
}
