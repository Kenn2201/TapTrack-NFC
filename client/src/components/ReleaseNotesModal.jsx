import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Modal from './ui/Modal';
import Button from './ui/Button';
import {
  CURRENT_VERSION,
  CURRENT_VERSION_LABEL,
  RELEASE_DATE,
  RELEASE_NAME,
} from '../constants/version';

const STORAGE_KEY = 'taptrack.whatsNew';
const DAY_MS = 24 * 60 * 60 * 1000;

const highlights = [
  'Public and invite-only event attendance rules',
  'Dedicated NFC setup and replacement request queue',
  'One-current-active-card safety checks',
  'Improved operator and administration workflows',
  'Navigation, accessibility, and release-quality UI polish',
];

function shouldAutoOpen(pathname) {
  const blocked = ['/t', '/operator', '/operator/nfc-reader'];
  return !blocked.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function ReleaseNotesModal({ open, onClose, auto = false }) {
  const location = useLocation();
  const [autoOpen, setAutoOpen] = useState(false);

  useEffect(() => {
    if (!auto || !shouldAutoOpen(location.pathname)) return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const staleVersion = saved.version !== CURRENT_VERSION;
      const staleTime = !saved.lastShownAt || Date.now() - Number(saved.lastShownAt) >= DAY_MS;
      if (staleVersion || staleTime) setAutoOpen(true);
    } catch {
      setAutoOpen(true);
    }
  }, [auto, location.pathname]);

  const isOpen = open || autoOpen;
  const title = useMemo(() => `What's New — ${CURRENT_VERSION_LABEL}`, []);

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: CURRENT_VERSION,
        lastShownAt: Date.now(),
      }));
    } catch {}
    setAutoOpen(false);
    onClose?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title={title} description={RELEASE_NAME} maxWidth="max-w-lg">
      <div className="space-y-4">
        <p className="text-xs text-slate-400">{RELEASE_DATE}</p>
        <ul className="space-y-2 text-sm text-slate-300">
          {highlights.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-cyan-400" aria-hidden="true">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button variant="outline" onClick={close}>Close</Button>
          <Link
            to="/changelog"
            onClick={close}
            className="min-h-[44px] inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Full Release Notes
          </Link>
        </div>
      </div>
    </Modal>
  );
}
