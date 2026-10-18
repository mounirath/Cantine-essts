import React from 'react';
import { Clock, Play, RotateCcw, Info } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface TimeSimulatorBarProps {
  isSimulated: boolean;
  simulatedTime: Date | null;
  onSetSimulation: (time: Date | null) => void;
  realTime: Date;
}

export const TimeSimulatorBar: React.FC<TimeSimulatorBarProps> = ({
  isSimulated,
  simulatedTime,
  onSetSimulation,
  realTime,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { t } = useLanguage();

  const setSpecificHour = (hours: number, minutes: number) => {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    onSetSimulation(d);
  };

  const currentEffective = isSimulated && simulatedTime ? simulatedTime : realTime;
  const timeFormatted = `${String(currentEffective.getHours()).padStart(2, '0')}:${String(currentEffective.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="no-print bg-slate-900 text-slate-100 text-xs border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSimulated ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isSimulated ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            ></span>
          </span>
          <span className="font-medium text-slate-300">
            {isSimulated ? t('simulationMode') : t('realClock')} :
          </span>
          <span className="font-mono font-bold text-amber-300 text-sm px-1.5 py-0.5 bg-slate-800 rounded">
            {timeFormatted}
          </span>
          {isSimulated && (
            <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
              {t('simulationActiveNotice')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 flex items-center gap-1 transition"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('testTimeSlots')}</span>
          </button>

          {isSimulated && (
            <button
              onClick={() => onSetSimulation(null)}
              className="px-2 py-1 bg-red-950/60 hover:bg-red-900 border border-red-700/50 rounded text-red-200 flex items-center gap-1 transition"
              title={t('backToRealTime')}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('backToRealTime')}</span>
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="bg-slate-950/80 border-t border-slate-800 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                {t('quickTestSlots')} (08:00 - 10:00) :
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSpecificHour(7, 30)}
                className="px-2.5 py-1 rounded bg-amber-900/30 hover:bg-amber-900/50 text-amber-200 border border-amber-600/40 flex items-center gap-1 font-medium"
              >
                <Play className="w-3 h-3 fill-amber-300" />
                <span>07:30</span>
                <span className="text-[10px] text-amber-300 font-bold">(🥐 Petit-déj ouvert)</span>
              </button>

              <button
                onClick={() => setSpecificHour(8, 45)}
                className="px-2.5 py-1 rounded bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-600/50 flex items-center gap-1 font-medium"
              >
                <Play className="w-3 h-3 fill-emerald-300" />
                <span>08:45</span>
                <span className="text-[10px] text-emerald-300 font-bold">(🍽️ Déjeuner ouvert)</span>
              </button>

              <button
                onClick={() => setSpecificHour(15, 30)}
                className="px-2.5 py-1 rounded bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-600/50 flex items-center gap-1 font-medium"
              >
                <Play className="w-3 h-3 fill-indigo-300" />
                <span>15:30</span>
                <span className="text-[10px] text-indigo-300 font-bold">(🌙 Dîner ouvert)</span>
              </button>

              <button
                onClick={() => setSpecificHour(10, 15)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1"
              >
                <span>10:15</span>
                <span className="text-[10px] text-rose-300 font-semibold">(Déjeuner clos)</span>
              </button>

              <button
                onClick={() => setSpecificHour(21, 30)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1"
              >
                <span>21:30</span>
                <span className="text-[10px] text-rose-300 font-semibold">(Tous fermés)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
