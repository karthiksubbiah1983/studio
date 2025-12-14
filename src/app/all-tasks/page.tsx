
"use client";

import { useBuilder } from "@/hooks/use-builder";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";

function FormattedDate({ timestamp }: { timestamp: string | undefined }) {
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    useEffect(() => {
        if (timestamp) {
            setFormattedDate(format(new Date(timestamp), "PPP p"));
        } else {
            setFormattedDate('—');
        }
    }, [timestamp]);

    // Render a placeholder on the server and initial client render
    if (formattedDate === null) {
        return <span>—</span>; // Or a loading skeleton
    }

    return <>{formattedDate}</>;
}

export default function AllTasksPage() {
  const { state } = useBuilder();
  const { tasks, forms, sites, submissions } = state;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<Record<string, any> | null>(null);

  const getFormData = (formId: string) => forms.find(f => f.id === formId);
  const getSiteData = (siteId: string) => sites.find(s => s.id === siteId);

  const filteredTasks = tasks.filter(task => {
    const form = getFormData(task.formId);
    const site = getSiteData(task.siteId);
    const lowerSearchTerm = searchTerm.toLowerCase();

    return (
      form?.title.toLowerCase().includes(lowerSearchTerm) ||
      site?.name.toLowerCase().includes(lowerSearchTerm) ||
      task.status.toLowerCase().includes(lowerSearchTerm)
    );
  });

  const handleViewSubmission = (submissionId: string | undefined) => {
    if (!submissionId) return;
    const submission = submissions.find(s => s.id === submissionId);
    if (submission) {
      setSelectedSubmission(submission.data);
    }
  }

  return (
    <div className="w-full p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>
      <Card>
        <CardContent className="pt-0">
          <div className="border-t">
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center p-4 border-b font-medium text-sm text-muted-foreground">
                  <div>Form</div>
                  <div>Site</div>
                  <div>Status</div>
                  <div>Submitted At</div>
                  <div className="text-right">Actions</div>
              </div>
              <div className="divide-y">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task: Task) => {
                    const form = getFormData(task.formId);
                    const site = getSiteData(task.siteId);

                    return (
                      <div key={task.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] items-center p-4 gap-4 md:gap-2">
                        <div className="font-medium">{form?.title || 'Unknown Form'}</div>
                        <div>
                            <span className="md:hidden font-medium mr-2">Site:</span>
                            {site?.name || 'Unknown Site'}
                        </div>
                        <div>
                            <span className="md:hidden font-medium mr-2">Status:</span>
                            <Badge className={cn(
                                task.status === 'Submitted' ? "bg-green-100 text-green-800 border-green-200" : "bg-blue-100 text-blue-800 border-blue-200"
                            )} variant={'outline'}>
                                {task.status}
                            </Badge>
                        </div>
                        <div>
                            <span className="md:hidden font-medium mr-2">Submitted At:</span>
                            <FormattedDate timestamp={task.submittedAt} />
                        </div>
                        <div className="flex justify-end gap-0">
                             <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleViewSubmission(task.submissionId)}
                                disabled={task.status !== 'Submitted' || !task.submissionId}
                             >
                              <Eye className="h-4 w-4" />
                            </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-24 text-center flex items-center justify-center">
                    No tasks found.
                  </div>
                )}
              </div>
          </div>
        </CardContent>
      </Card>
      
      {/* View Submission Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Submission Data</DialogTitle>
                <DialogDescription>
                    The data that was submitted for this task.
                </DialogDescription>
            </DialogHeader>
            <pre className="mt-2 w-full max-h-96 overflow-y-auto rounded-md bg-slate-950 p-4">
                <code className="text-white">{JSON.stringify(selectedSubmission, null, 2)}</code>
            </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
