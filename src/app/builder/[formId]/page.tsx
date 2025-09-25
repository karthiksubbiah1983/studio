
"use client";

import { useEffect } from "react";
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

    useEffect(() => {
        if (formId && state.activeFormId !== formId) {
            dispatch({ type: 'SET_ACTIVE_FORM', payload: { formId } });
        }
    }, [formId, dispatch, state.activeFormId]);

    const form = state.forms.find(f => f.id === formId);

    // Only render the builder once the correct form is active and loaded.
    if (!form || state.activeFormId !== formId) {
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
