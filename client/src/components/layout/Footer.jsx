import { Link } from 'react-router-dom';
import { CURRENT_VERSION_LABEL } from '../../constants/version';

/**
 * Footer — Shared app footer for authenticated and secondary pages.
 * Public marketing footer lives inline on the Landing page.
 */
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-[10px] font-black">
            TT
          </span>
          <span className="font-semibold text-slate-300">TapTrack NFC</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
            {CURRENT_VERSION_LABEL}
          </span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-4" aria-label="Footer">
          <Link to="/compatibility" className="hover:text-white transition-colors">
            Compatibility
          </Link>
          <Link to="/events" className="hover:text-white transition-colors">
            Events
          </Link>
          <Link to="/login" className="hover:text-white transition-colors">
            Sign In
          </Link>
        </nav>

        <p className="text-slate-500 text-center sm:text-right">
          © {new Date().getFullYear()} TapTrack NFC Demo. Public technology demonstration.
        </p>
      </div>
    </footer>
  );
}
