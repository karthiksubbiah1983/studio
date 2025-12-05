
"use client";

import { useBuilder } from "@/hooks/use-builder";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Edit } from "lucide-react";
import type { Task } from "@/lib/types";

export default function MyTasksPage() {
  const { state } = useBuilder();
  const { tasks, forms } = state;
  const router = useRouter();

  const assignedTasks = tasks.filter(t => t.status === 'Assigned');

  const getFormTitle = (formId: string) => {
    return forms.find(f => f.id === formId)?.title || "Unknown Form";
  }

  return (
    <div className="w-full p-4 md:p-6">
      <Card>
        <CardContent className="p-0">
          <div className="border-t">
            <div className="hidden md:grid grid-cols-[3fr_1fr_auto] items-center p-4 border-b font-medium text-sm text-muted-foreground">
              <div>Form</div>
              <div>Assigned At</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y">
              {assignedTasks.length > 0 ? (
                assignedTasks.map((task: Task) => (
                  <div key={task.id} className="grid grid-cols-1 md:grid-cols-[3fr_1fr_auto] items-center p-4 gap-4 md:gap-2">
                    <div className="font-medium">{getFormTitle(task.formId)}</div>
                    <div>
                      <span className="md:hidden font-medium mr-2">Assigned:</span>
                      {format(new Date(task.assignedAt), "PPP p")}
                    </div>
                    <div className="flex justify-end gap-0">
                      <button 
                        className="flex items-center gap-2 text-primary"
                        onClick={() => router.push(`/my-tasks/${task.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                        <span>Fill Form</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-24 text-center flex items-center justify-center">
                  You have no assigned tasks.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
