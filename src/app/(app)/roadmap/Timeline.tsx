import { Stethoscope, ClipboardList, Sparkles, Target, Lightbulb, Flag } from 'lucide-react';
import type { RoadmapItem } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

const TYPE_META: Record<
  RoadmapItem['type'],
  {
    icon: typeof Stethoscope;
    label: string;
    variant: 'sage' | 'sky' | 'clay' | 'gray';
    dot: string;
  }
> = {
  diagnosis: { icon: Stethoscope, label: 'Diagnosis', variant: 'clay', dot: 'bg-clay-100 text-clay-500 ring-clay-200' },
  evaluation: { icon: ClipboardList, label: 'Evaluation', variant: 'sky', dot: 'bg-sky-100 text-sky-700 ring-sky-200' },
  service_start: { icon: Sparkles, label: 'Service', variant: 'sage', dot: 'bg-sage-100 text-sage-700 ring-sage-200' },
  goal: { icon: Target, label: 'Goal', variant: 'sky', dot: 'bg-sky-100 text-sky-700 ring-sky-200' },
  recommendation: { icon: Lightbulb, label: 'Recommendation', variant: 'gray', dot: 'bg-gray-100 text-gray-600 ring-gray-200' },
  milestone: { icon: Flag, label: 'Milestone', variant: 'gray', dot: 'bg-gray-100 text-gray-600 ring-gray-200' },
  next_step: { icon: Sparkles, label: 'Next Step', variant: 'sage', dot: 'bg-sage-100 text-sage-700 ring-sage-200' },
};

export function Timeline({ items }: { items: RoadmapItem[] }) {
  const timelineItems = items
    .filter((i) => i.type !== 'next_step')
    .sort((a, b) => {
      if (!a.item_date && !b.item_date) return 0;
      if (!a.item_date) return 1;
      if (!b.item_date) return -1;
      return new Date(a.item_date).getTime() - new Date(b.item_date).getTime();
    });

  if (timelineItems.length === 0) {
    return (
      <div className="card text-center text-sm text-sage-500">
        Your timeline is empty. Upload a document above and Compass will start building
        it for you.
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="mb-5 text-base font-semibold text-sage-900">Your journey so far</h3>
      <ol className="relative space-y-6 border-l-2 border-sage-100 pl-6">
        {timelineItems.map((item) => {
          const meta = TYPE_META[item.type];
          return (
            <li key={item.id} className="relative">
              <span className={`absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full ring-2 ${meta.dot}`}>
                <meta.icon className="h-3.5 w-3.5" />
              </span>
              <div className="flex items-center gap-2">
                <Badge variant={meta.variant}>{meta.label}</Badge>
                {item.item_date && (
                  <span className="text-xs text-sage-400">
                    {new Date(item.item_date).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-sage-900">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-sm text-sage-600">{item.description}</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
