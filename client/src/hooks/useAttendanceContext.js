import { useCallback, useEffect, useState } from 'react';
import {
  ATTENDANCE_CONTEXT_STORAGE_KEY,
  clearAttendanceContext,
  readAttendanceContext,
  startAttendanceContext,
} from '../utils/attendanceContext';

export default function useAttendanceContext() {
  const [context, setContext] = useState(() => readAttendanceContext());

  const refresh = useCallback(() => {
    setContext(readAttendanceContext());
  }, []);

  useEffect(() => {
    const onStorage = (event) => {
      if (!event.key || event.key === ATTENDANCE_CONTEXT_STORAGE_KEY) {
        refresh();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const start = useCallback((session) => {
    const saved = startAttendanceContext({
      sessionId: session.id,
      eventId: session.eventId,
    });
    setContext(saved);
    return saved;
  }, []);

  const stop = useCallback(() => {
    clearAttendanceContext();
    setContext(null);
  }, []);

  return { context, start, stop, refresh };
}
