
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
        dispatch({ type: 'SET_ACTIVE_FORM', payload: { formId } });
    }, [formId, dispatch]);

    const form = state.forms.find(f => f.id === formId);

    if (!form) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Form not found.</p>
            </div>
        )
    }

    return (
        <main className="flex flex-col h-screen w-full">
            <Builder />
        </main>
    );
}
