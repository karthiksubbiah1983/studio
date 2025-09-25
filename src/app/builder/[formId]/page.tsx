
"use client";

import { useEffect, useState } from "react";
import { useBuilder } from "@/hooks/use-builder";
import { Builder } from "@/components/builder/builder";
import { Form } from "@/lib/types";
import { useRouter } from "next/navigation";

type Props = {
    params: {
        formId: string;
    }
}
export default function BuilderPage({ params }: Props) {
    const { dispatch, activeForm } = useBuilder();
    const { formId } = params;
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        if (formId && activeForm?.id !== formId) {
            // Lazy load the form data from localStorage
            const storedForm = localStorage.getItem(`form-builder-form-${formId}`);
            if (storedForm) {
                try {
                    const form: Form = JSON.parse(storedForm);
                    dispatch({ type: 'LOAD_FORM_DATA', payload: { form } });
                } catch (e) {
                    console.error("Failed to parse form data from localStorage", e);
                }
            } else {
                // If form doesn't exist, maybe redirect to a 404 page or home
                console.warn(`Form with id ${formId} not found in localStorage.`);
                router.push('/');
            }
        }
    }, [formId, dispatch, activeForm?.id, router, isClient]);

    if (!isClient) {
        return null;
    }

    if (!activeForm || activeForm.id !== formId) {
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
