
'use client';

import { useBuilder } from '@/hooks/use-builder';
import { FormPreview } from '@/components/form-preview';

type Props = {
  params: { taskId: string };
};

export default function FillTaskPage({ params }: Props) {
  const { state, setFormState } = useBuilder();
  const { taskId } = params;

  const task = state.tasks.find(t => t.id === taskId);

  if (!task) {
    return <div>Task not found</div>;
  }
  
  const form = state.forms.find(f => f.id === task.formId);
  const version = form?.versions.find(v => v.id === task.versionId);

  if (!form || !version) {
    return <div>Form or version not found</div>;
  }

  // Set an empty form state when the component mounts to ensure a clean slate
  // This could be enhanced to load saved progress if needed in the future
  useState(() => {
      setFormState({});
  });

  return (
      <FormPreview sections={version.sections} showSubmitButton={true} taskId={taskId} />
  );
}
