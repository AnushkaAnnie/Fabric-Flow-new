'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent } from '@/components/ui/card';
import {
  RefreshCw, ClipboardPlus, Play, CheckCircle2, Ban, Calendar, Activity, Info
} from 'lucide-react';

interface ProductionEvent {
  id: number;
  productionPlanId?: number;
  jobCardId?: number;
  eventType: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export default function EventsPage() {
  const { data: events = [], isLoading } = useQuery<ProductionEvent[]>({
    queryKey: ['production-events'],
    queryFn: async () => (await api.get('/production-planning/events')).data,
    refetchInterval: 30000,
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'PLAN_CREATED':
        return <ClipboardPlus className="h-4 w-4 text-blue-400" />;
      case 'JOB_CARD_CREATED':
        return <Calendar className="h-4 w-4 text-indigo-400" />;
      case 'JOB_CARD_STARTED':
        return <Play className="h-4 w-4 text-amber-400" />;
      case 'JOB_CARD_COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'PLAN_CANCELLED':
        return <Ban className="h-4 w-4 text-rose-400" />;
      default:
        return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'PLAN_CREATED':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'JOB_CARD_CREATED':
        return 'bg-indigo-500/10 border-indigo-500/30';
      case 'JOB_CARD_STARTED':
        return 'bg-amber-500/10 border-amber-500/30';
      case 'JOB_CARD_COMPLETED':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'PLAN_CANCELLED':
        return 'bg-rose-500/10 border-rose-500/30';
      default:
        return 'bg-slate-800/80 border-slate-700/50';
    }
  };

  return (
    <ProtectedRoute>
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          Operational Event Timeline
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Complete, tamper-evident audit history of all production plan lifecycles and machine operations.
        </p>
      </div>

      <Card className="glass-card border-slate-800 bg-slate-900/40">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-12 flex justify-center items-center text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Loading event log...
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No MES events have been recorded yet. Create a plan to start auditing.
            </div>
          ) : (
            <div className="relative pl-6 border-l border-slate-800 space-y-6">
              {events.map((event) => (
                <div key={event.id} className="relative group">
                  {/* Icon Node */}
                  <div className={`absolute -left-10 top-0.5 p-2 rounded-xl border flex items-center justify-center ${getEventColor(event.eventType)} shadow-lg`}>
                    {getEventIcon(event.eventType)}
                  </div>

                  {/* Log Content Card */}
                  <div className="border border-slate-800/60 bg-slate-900/30 rounded-xl p-4 transition-all duration-300 hover:border-slate-700/50 hover:bg-slate-800/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {event.eventType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-sm text-slate-200 mt-2 font-medium">
                      {event.message}
                    </p>

                    {/* Meta labels */}
                    <div className="flex gap-4 mt-3">
                      {event.productionPlanId && (
                        <div className="text-[10px] text-slate-500">
                          Plan ID: <strong className="text-slate-400">#{event.productionPlanId}</strong>
                        </div>
                      )}
                      {event.jobCardId && (
                        <div className="text-[10px] text-slate-500">
                          Job Card ID: <strong className="text-slate-400">#{event.jobCardId}</strong>
                        </div>
                      )}
                    </div>

                    {/* Metadata details if exists */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-3 bg-slate-950/80 border border-slate-800/50 rounded-lg p-2.5">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                          <Info className="h-3 w-3" /> Event Metadata
                        </span>
                        <pre className="text-[10px] text-slate-400 font-mono overflow-x-auto max-w-full">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </ProtectedRoute>
  );
}
