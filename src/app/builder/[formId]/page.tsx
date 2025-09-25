
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
        // This effect ensures the active form is set correctly when the page loads,
        // even in a new tab.
        if (formId && state.activeFormId !== formId) {
            dispatch({ type: 'SET_ACTIVE_FORM', payload: { formId } });
        }
        // Once the formId from the URL matches the activeFormId in the state,
        // we can consider the component ready to render.
        if (state.activeFormId === formId) {
            setIsReady(true);
        }
    }, [formId, dispatch, state.activeFormId]);

    const form = state.forms.find(f => f.id === formId);

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
