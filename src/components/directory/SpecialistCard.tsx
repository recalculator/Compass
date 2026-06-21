import Image from 'next/image';
import { Phone, Globe, Video, MapPin } from 'lucide-react';
import type { Specialist } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

const SPECIALTY_LABELS: Record<Specialist['specialty_type'], string> = {
  aba: 'ABA Therapy',
  speech: 'Speech Therapy',
  ot: 'Occupational Therapy',
  feeding: 'Feeding Therapy',
  developmental_pediatrician: 'Developmental Pediatrician',
  pt: 'Physical Therapy',
  psychology: 'Psychology',
  neurology: 'Neurology',
  other: 'Other',
};

export function SpecialistCard({ specialist }: { specialist: Specialist }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/specialist-avatar.png"
            alt=""
            width={44}
            height={44}
            className="rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-sage-900">{specialist.name}</h3>
            {specialist.practice_name && (
              <p className="text-sm text-sage-500">{specialist.practice_name}</p>
            )}
          </div>
        </div>
        <Badge variant="sky">{SPECIALTY_LABELS[specialist.specialty_type]}</Badge>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-sm text-sage-600">
        <MapPin className="h-4 w-4 text-sage-400" />
        {[specialist.city, specialist.state, specialist.zip_code].filter(Boolean).join(', ')}
      </div>

      {specialist.phone && (
        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-sage-600">
          <Phone className="h-4 w-4 text-sage-400" />
          {specialist.phone}
        </div>
      )}

      {specialist.website && (
        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-sage-600">
          <Globe className="h-4 w-4 text-sage-400" />
          <a href={specialist.website} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">
            Visit website
          </a>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {specialist.telehealth && (
          <Badge variant="sage">
            <Video className="mr-1 h-3 w-3" />
            Telehealth available
          </Badge>
        )}
        {(specialist.insurance_accepted ?? []).map((ins) => (
          <Badge key={ins} variant="gray">{ins}</Badge>
        ))}
      </div>

      {specialist.notes && (
        <p className="mt-3 text-sm italic text-sage-500">{specialist.notes}</p>
      )}
    </div>
  );
}
