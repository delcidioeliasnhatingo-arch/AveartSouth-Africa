import React, { useEffect, useState } from 'react';
import { Cookie, Settings, X } from 'lucide-react';

type CookieChoices = { necessary: true; analytics: boolean; marketing: boolean; savedAt: string };
const STORAGE_KEY = 'aveart-cookie-consent-v1';

interface CookieConsentProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onNavigate }) => {
  const [visible, setVisible] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) setVisible(true);
      else {
        const choices = JSON.parse(saved) as CookieChoices;
        setAnalytics(Boolean(choices.analytics));
        setMarketing(Boolean(choices.marketing));
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (allowOptional: boolean) => {
    const choices: CookieChoices = {
      necessary: true,
      analytics: allowOptional && analytics,
      marketing: allowOptional && marketing,
      savedAt: new Date().toISOString(),
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(choices)); } catch { /* storage may be unavailable */ }
    setAnalytics(choices.analytics);
    setMarketing(choices.marketing);
    setPreferencesOpen(false);
    setVisible(false);
    window.dispatchEvent(new CustomEvent('aveart-cookie-consent-updated', { detail: choices }));
  };

  if (!visible) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button onClick={() => { setVisible(true); setPreferencesOpen(true); }} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-lg hover:bg-slate-50" aria-label="Open cookie preferences">
          <Settings className="h-4 w-4" /> Cookie Preferences
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="mt-1 rounded-xl bg-rose-50 p-2 text-rose-600"><Cookie className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <h2 id="cookie-title" className="text-lg font-black text-slate-900">Your privacy matters</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">We use essential cookies to keep AVEART working, including shopping-bag and checkout functions. With your permission, optional analytics and marketing cookies may also be used. You can change your choice at any time.</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
              <button className="font-semibold text-rose-600 underline underline-offset-4" onClick={() => onNavigate('policy', 'privacy')}>Privacy Policy</button>
              <button className="font-semibold text-rose-600 underline underline-offset-4" onClick={() => onNavigate('policy', 'cookies')}>Cookie Policy</button>
            </div>
          </div>
          <button onClick={() => save(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Reject optional cookies and close"><X className="h-5 w-5" /></button>
        </div>

        {preferencesOpen && (
          <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold text-slate-900">Necessary cookies</p><p className="text-xs text-slate-500">Required for core store functions.</p></div><span className="text-xs font-bold text-emerald-700">Always on</span></div>
            <label className="flex cursor-pointer items-center justify-between gap-4"><span><span className="block text-sm font-bold text-slate-900">Analytics cookies</span><span className="text-xs text-slate-500">Help improve the shopping experience.</span></span><input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} className="h-4 w-4 accent-rose-600" /></label>
            <label className="flex cursor-pointer items-center justify-between gap-4"><span><span className="block text-sm font-bold text-slate-900">Marketing cookies</span><span className="text-xs text-slate-500">Help measure or personalise advertising.</span></span><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} className="h-4 w-4 accent-rose-600" /></label>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button onClick={() => save(false)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Reject Non-Essential</button>
          <button onClick={() => setPreferencesOpen(v => !v)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">{preferencesOpen ? 'Hide Preferences' : 'Cookie Preferences'}</button>
          <button onClick={() => { setAnalytics(true); setMarketing(true); save(true); }} className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-700">Accept All Cookies</button>
          {preferencesOpen && <button onClick={() => save(true)} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">Save My Choices</button>}
        </div>
      </div>
    </div>
  );
};
