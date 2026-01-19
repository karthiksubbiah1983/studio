'use client';

import { useMemo, useState, useEffect } from 'react';
import { useBuilder } from '@/hooks/use-builder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileClock, ListTodo } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type AuditEvent = {
  type: 'Assigned' | 'Submitted';
  timestamp: string;
  message: string;
};

function FormattedDate({ timestamp }: { timestamp: string }) {
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    useEffect(() => {
        if (timestamp) {
            setFormattedDate(format(new Date(timestamp), "PPP p"));
        } else {
            setFormattedDate('—');
        }
    }, [timestamp]);

    if (formattedDate === null) {
        return <span>—</span>;
    }

    return <>{formattedDate}</>;
}


export default function TaskHistoryPage() {
  const { state } = useBuilder();
  const { tasks, forms, sites } = state;

  const auditEvents: AuditEvent[] = useMemo(() => {
    const events: AuditEvent[] = [];

    tasks.forEach(task => {
      const form = forms.find(f => f.id === task.formId);
      const site = sites.find(s => s.id === task.siteId);
      const formTitle = form?.title || 'Unknown Form';
      const siteName = site?.name || 'Unknown Site';

      // Task Assigned Event
      events.push({
        type: 'Assigned',
        timestamp: task.assignedAt,
        message: `Task "${formTitle}" was assigned to site "${siteName}".`,
      });

      // Task Submitted Event
      if (task.status === 'Submitted' && task.submittedAt) {
        events.push({
          type: 'Submitted',
          timestamp: task.submittedAt,
          message: `Task "${formTitle}" from site "${siteName}" was submitted.`,
        });
      }
    });

    // Sort events chronologically, newest first
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [tasks, forms, sites]);

  return (
    <div className="w-full p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Task History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {auditEvents.length > 0 ? (
              auditEvents.map((event, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {event.type === 'Assigned' ? (
                        <ListTodo className="h-5 w-5 text-primary" />
                      ) : (
                        <FileClock className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 border-b pb-6 last:border-b-0">
                    <div className="flex justify-between items-center">
                       <p className="text-sm font-medium">{event.message}</p>
                       <Badge variant={'outline'} className={cn(
                           event.type === 'Submitted' ? "bg-green-100 text-green-800 border-green-200" : "bg-blue-100 text-blue-800 border-blue-200"
                       )}>
                        {event.type}
                       </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <FormattedDate timestamp={event.timestamp} />
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-12">
                No task history found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
