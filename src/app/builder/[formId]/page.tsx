
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
    const { dispatch } = useBuilder();
    const { formId } = params;

    useEffect(() => {
        dispatch({ type: "SET_ACTIVE_FORM", payload: { formId } });
    }, [formId, dispatch]);

    return (
        <main className="flex flex-col h-screen w-full">
            <Builder />
        </main>
    );
}
