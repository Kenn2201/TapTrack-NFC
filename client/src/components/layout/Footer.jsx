import { Link } from 'react-router-dom';
import { CURRENT_VERSION_LABEL } from '../../constants/version';

const external = [
  ['Portfolio', 'https://kenncode.me'],
  ['GitHub', 'https://github.com/Kenn2201'],
  ['LinkedIn', 'https://www.linkedin.com/in/kenn-vincent-a-nacario-31929b297/'],
  ['Email', 'mailto:kenn.nacario12@gmail.com'],
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white text-[10px] font-black">TT</span>
              <span className="font-semibold text-slate-200">TapTrack NFC</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Mobile-first NFC card provisioning and attendance technology demonstration.
            </p>
            <span className="mt-3 inline-flex text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
              {CURRENT_VERSION_LABEL}
            </span>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Product</h2>
            <nav className="mt-3 flex flex-col gap-2 text-sm" aria-label="Product footer">
              <Link to="/compatibility" className="hover:text-white transition-colors">Compatibility</Link>
              <Link to="/terminology" className="hover:text-white transition-colors">Terminology</Link>
              <Link to="/changelog" className="hover:text-white transition-colors">Release Notes</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
            </nav>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Built by Kenn Nacario</h2>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              {external.map(([label, href]) => (
                <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="hover:text-white transition-colors">
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Technology</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Powered by Vercel, Render, Neon, and Resend.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Built with React, Vite, Express, and PostgreSQL.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} TapTrack NFC. Public technology demonstration.</p>
          <p>Release candidate — human acceptance required before LIVE status.</p>
        </div>
      </div>
    </footer>
  );
}
