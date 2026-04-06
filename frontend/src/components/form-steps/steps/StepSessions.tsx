import { SessionRepeater, type SessionSchedule } from '../../SessionRepeater';

interface StepSessionsProps {
  sessions: SessionSchedule[];
  setSessions: (sessions: SessionSchedule[]) => void;
}

export function StepSessions({ sessions, setSessions }: StepSessionsProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#13213f]/60 p-4">
        <SessionRepeater
          sessions={sessions}
          onChange={setSessions}
          disabled={false}
        />
      </div>
    </div>
  );
}
