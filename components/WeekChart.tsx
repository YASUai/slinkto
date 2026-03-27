'use client';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function WeekChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);

  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <p className="text-xs mb-3" style={{ color: '#6b7280' }}>Clicks this week</p>
      <div className="flex items-end gap-1.5 h-16">
        {data.map((val, i) => {
          const heightPct = (val / max) * 100;
          const isToday = i === data.length - 1;
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-full rounded-sm relative overflow-hidden"
                style={{ height: '48px', background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="absolute bottom-0 w-full rounded-sm transition-all duration-500"
                  style={{
                    height: `${Math.max(heightPct, val > 0 ? 8 : 0)}%`,
                    background: isToday
                      ? 'linear-gradient(to top, #E53935, #FF6B6B)'
                      : 'linear-gradient(to top, rgba(229,57,53,0.6), rgba(255,107,107,0.4))',
                  }}
                />
              </div>
              <span className="text-xs" style={{ color: isToday ? '#E53935' : '#4b5563', fontSize: '10px' }}>
                {DAYS[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
