'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useSendPrescription } from '@/lib/doctor/hooks/useClinicalQueries';
import { sageUi } from '@/lib/doctor/ui-tokens';

type RxLine = { drugName: string; dosage: string; frequency: string; duration: string };

const EMPTY: RxLine = { drugName: '', dosage: '', frequency: 'OD', duration: '5 days' };

export default function PrescriptionBuilder({ patientId }: { patientId?: string }) {
  const [lines, setLines] = useState<RxLine[]>([{ ...EMPTY }]);
  const sendRx = useSendPrescription();

  const addLine = () => setLines((l) => [...l, { ...EMPTY }]);
  const removeLine = (i: number) => setLines((l) => l.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof RxLine, value: string) =>
    setLines((l) => l.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));

  const onSend = () => {
    if (!patientId) {
      toast.error('Select a patient first');
      return;
    }
    const valid = lines.filter((l) => l.drugName.trim());
    if (!valid.length) {
      toast.error('Add at least one medication');
      return;
    }
    sendRx.mutate(
      { patientId, items: valid },
      {
        onSuccess: () => toast.success('Prescription sent to pharmacy'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div className="space-y-3">
      {lines.map((line, i) => (
        <div key={i} className={`${sageUi.cardSolid} grid gap-2 p-3 sm:grid-cols-5`}>
          <input
            className={sageUi.input}
            placeholder="Drug"
            value={line.drugName}
            onChange={(e) => update(i, 'drugName', e.target.value)}
          />
          <input
            className={sageUi.input}
            placeholder="Dose"
            value={line.dosage}
            onChange={(e) => update(i, 'dosage', e.target.value)}
          />
          <input
            className={sageUi.input}
            placeholder="Frequency"
            value={line.frequency}
            onChange={(e) => update(i, 'frequency', e.target.value)}
          />
          <input
            className={sageUi.input}
            placeholder="Duration"
            value={line.duration}
            onChange={(e) => update(i, 'duration', e.target.value)}
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => removeLine(i)}>
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={addLine}>
          <Plus className="mr-1 h-4 w-4" aria-hidden />
          Add medication
        </Button>
        <Button type="button" size="sm" className={sageUi.btnPrimary} onClick={onSend} disabled={sendRx.isPending}>
          Send to pharmacy
        </Button>
      </div>
    </div>
  );
}
