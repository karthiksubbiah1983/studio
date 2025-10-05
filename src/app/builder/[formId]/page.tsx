
"use client";

import { useEffect, useState, use } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Builder } from "@/components/builder/builder";
import { useRouter } from "next/navigation";

type Props = {
    params: Promise<{ formId: string }>;
}
export default function BuilderPage({ params }: Props) {
    const { formId } = use(params);
    const { state, dispatch } = useBuilder();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

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

        setIsLoading(false);

    }, [formId, state.forms, state.activeFormId, dispatch, router]);

    // Don't render the builder if we're about to redirect or still loading
    if (isLoading) {
        return null;
    }

    return (
        <div className="flex flex-col h-full w-full">
            <Builder formId={formId} />
        </div>
    );
}
