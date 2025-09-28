
"use client";

import { useEffect } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Builder } from "@/components/builder/builder";
import { useRouter } from "next/navigation";

type Props = {
    params: {
        formId: string;
    }
}
export default function BuilderPage({ params: { formId } }: Props) {
    const { state, dispatch } = useBuilder();
    const router = useRouter();

    useEffect(() => {
        const formExists = state.forms.some(f => f.id === formId);
        if (!formExists) {
            // Redirect to home if the form doesn't exist
            router.replace('/');
            return;
        }
        
        // Set the active form based on the URL parameter
        if (formId && state.activeFormId !== formId) {
            dispatch({ type: "SET_ACTIVE_FORM", payload: { formId } });
        }
    }, [formId, state.activeFormId, dispatch, state.forms, router]);

    // Don't render the builder if we're about to redirect
    if (!state.forms.some(f => f.id === formId)) {
        return null;
    }

    return (
        <div className="flex flex-col h-full w-full">
            <Builder />
        </div>
    );
}
