
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
    const { state, dispatch } = useBuilder();

    useEffect(() => {
        // Set the active form based on the URL parameter
        if (formId && state.activeFormId !== formId) {
            dispatch({ type: "SET_ACTIVE_FORM", payload: { formId } });
        }
    }, [formId, state.activeFormId, dispatch]);

    return (
        <main className="flex flex-col h-screen w-full">
            <Builder />
        </main>
    );
}
