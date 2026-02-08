
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useBuilder } from '@/hooks/use-builder';
import { ChecklistCategory, ChecklistQuestion, ChecklistAnswerOption, TaskTypeConfiguration } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Response = {
    questionId: string;
    selectedAnswers: string[];
    comment?: string;
};

type ChecklistData = {
    responses: Response[];
};

type User = {
  uid: string;
  email: string | null;
  username: string | null;
};

type Props = {
    taskTypeId: string;
    categoryId: string;
    value?: ChecklistData;
    onChange: (data: ChecklistData) => void;
    onBack: () => void;
    user: User | null;
};

export function Checklist({ taskTypeId, categoryId, value, onChange, onBack, user }: Props) {
    const { checklistRepository, taskTypeConfigurations } = useBuilder().state;
    const { toast } = useToast();
    const [responses, setResponses] = useState<Response[]>(value?.responses || []);

    const config = useMemo(
        () => taskTypeConfigurations.find(c => c.taskTypeId === taskTypeId),
        [taskTypeConfigurations, taskTypeId]
    );
    
    const updateResponse = (questionId: string, updates: Partial<Response>) => {
        setResponses(prev => {
            const existingIndex = prev.findIndex(r => r.questionId === questionId);
            let newResponses = [...prev];
            if (existingIndex > -1) {
                newResponses[existingIndex] = { ...newResponses[existingIndex], ...updates };
            } else {
                newResponses.push({ questionId, selectedAnswers: [], ...updates });
            }
            return newResponses;
        });
    };

    const handleAnswerSelect = (question: ChecklistQuestion, answerId: string) => {
        const existingResponse = responses.find(r => r.questionId === question.id);
        let currentAnswers = existingResponse?.selectedAnswers || [];

        if (question.answerType === 'single-select' || question.answerType === 'yes-no') {
            currentAnswers = [answerId];
        } else { // multi-select
            if (currentAnswers.includes(answerId)) {
                currentAnswers = currentAnswers.filter(id => id !== answerId);
            } else {
                currentAnswers.push(answerId);
            }
        }
        updateResponse(question.id, { selectedAnswers: currentAnswers });
    };

    const handleCommentChange = (questionId: string, comment: string) => {
        updateResponse(questionId, { comment });
    };
    
    const handleSubmit = () => {
        // Validation
        for (const question of checklistRepository.questions) {
             const response = responses.find(r => r.questionId === question.id);
             if (!response || response.selectedAnswers.length === 0) continue;

             const isCommentRequired = question.answerOptions.some(opt => 
                response.selectedAnswers.includes(opt.id) && opt.isCommentRequired
             );

             if(isCommentRequired && (!response.comment || response.comment.trim() === '')) {
                toast({
                    variant: 'destructive',
                    title: 'Validation Error',
                    description: `A comment is required for your selection on the question: "${question.label}"`
                });
                return;
             }
        }
        onChange({ responses });
    }

    const renderQuestion = (question: ChecklistQuestion) => {
        const isQuestionEnabled = config?.enabledQuestionIds.includes(question.id);
        if (!isQuestionEnabled) return null;

        const response = responses.find(r => r.questionId === question.id);
        const selectedAnswers = response?.selectedAnswers || [];
        
        const isCommentRequired = question.answerOptions.some(opt => 
            selectedAnswers.includes(opt.id) && opt.isCommentRequired
        );
        
        const commentPlaceholder = question.answerOptions.find(opt => 
            selectedAnswers.includes(opt.id) && opt.isCommentRequired
        )?.commentPlaceholder || "Please provide a comment.";


        return (
            <div key={question.id} className="p-4 border rounded-md bg-background">
                <Label className="font-medium">{question.label}</Label>
                <div className="mt-2 space-y-2">
                    {question.answerType === 'single-select' || question.answerType === 'yes-no' ? (
                        <RadioGroup
                            value={selectedAnswers[0] || ""}
                            onValueChange={(value) => handleAnswerSelect(question, value)}
                        >
                            {question.answerOptions.map(opt => (
                                <div key={opt.id} className="flex items-start space-x-3">
                                    <div className="flex items-center h-5">
                                        <RadioGroupItem value={opt.id} id={`${question.id}-${opt.id}`} />
                                    </div>
                                    <div className="text-sm">
                                        <Label htmlFor={`${question.id}-${opt.id}`} className="font-normal">{opt.label}</Label>
                                    </div>
                                </div>
                            ))}
                        </RadioGroup>
                    ) : ( // 'multi-select'
                        question.answerOptions.map(opt => {
                            const isChecked = selectedAnswers.includes(opt.id);
                            return (
                                <div key={opt.id} className="flex items-start space-x-3">
                                    <div className="flex items-center h-5">
                                        <Checkbox 
                                            id={`${question.id}-${opt.id}`} 
                                            checked={isChecked}
                                            onCheckedChange={() => handleAnswerSelect(question, opt.id)}
                                        />
                                    </div>
                                    <div className="text-sm">
                                        <Label htmlFor={`${question.id}-${opt.id}`} className="font-normal">{opt.label}</Label>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
                {isCommentRequired && (
                    <div className="mt-3 space-y-1">
                        <Label className="text-xs font-medium text-destructive">Comment Required</Label>
                        <Textarea 
                            placeholder={commentPlaceholder} 
                            value={response?.comment || ''}
                            onChange={(e) => handleCommentChange(question.id, e.target.value)}
                        />
                    </div>
                )}
            </div>
        );
    };
    
    const renderCategories = (categories: ChecklistCategory[]) => {
        return categories.map(catL1 => {
            // Only render the top-level category passed in the `categoryId` prop
            if (catL1.id !== categoryId) return null;

            const isL1Enabled = config?.enabledCategoryIds.includes(catL1.id);
            if (!isL1Enabled) return null;

            const questionsL1 = checklistRepository.questions.filter(q => q.categoryId === catL1.id && !q.subCategoryId);

            return (
                <div key={catL1.id} className="space-y-4">
                    {questionsL1?.map(q => renderQuestion(q))}
                    {catL1.children && (
                        <Accordion type="multiple" className="w-full space-y-4">
                            {catL1.children.map(catL2 => {
                                const isL2Enabled = config?.enabledCategoryIds.includes(catL2.id);
                                if (!isL2Enabled) return null;

                                const questionsL2 = checklistRepository.questions.filter(q => q.subCategoryId === catL2.id && !q.subSubCategoryId);

                                return (
                                    <Card key={catL2.id}>
                                        <AccordionItem value={catL2.id} className="border-0">
                                            <AccordionTrigger className="p-4 font-semibold hover:no-underline">{catL2.name}</AccordionTrigger>
                                            <AccordionContent className="px-4 pb-4 space-y-4">
                                                {questionsL2.map(q => renderQuestion(q))}
                                                {catL2.children && (
                                                    <Accordion type="multiple" className="w-full space-y-4">
                                                        {catL2.children.map(catL3 => {
                                                            const isL3Enabled = config?.enabledCategoryIds.includes(catL3.id);
                                                            if (!isL3Enabled) return null;
                                                            const questionsL3 = checklistRepository.questions.filter(q => q.subSubCategoryId === catL3.id);
                                                            return (
                                                                <Card key={catL3.id}>
                                                                    <AccordionItem value={catL3.id} className="border-0">
                                                                        <AccordionTrigger className="p-3 text-sm hover:no-underline">{catL3.name}</AccordionTrigger>
                                                                        <AccordionContent className="px-3 pb-3 space-y-4">
                                                                            {questionsL3.map(q => renderQuestion(q))}
                                                                        </AccordionContent>
                                                                    </AccordionItem>
                                                                </Card>
                                                            );
                                                        })}
                                                    </Accordion>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Card>
                                );
                            })}
                        </Accordion>
                    )}
                </div>
            );
        });
    };
    
    if (!config) {
        return (
            <div className="text-center p-4 border rounded-md bg-muted/50">
                <p className="text-sm text-muted-foreground">This checklist has not been configured for the selected Task Type.</p>
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="space-y-4">
                {renderCategories(checklistRepository.categories)}
            </div>
            <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
                <Button onClick={handleSubmit}>Save Checklist</Button>
            </div>
        </div>
    );
}
