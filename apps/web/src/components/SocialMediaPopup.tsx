import { useState, useEffect } from 'react';

export default function SocialMediaPopup() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show popup after 5 seconds if not dismissed in this session
    const wasDismissed = sessionStorage.getItem('social_popup_dismissed');
    if (wasDismissed) return;
    
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem('social_popup_dismissed', 'true');
  }

  if (!show || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={dismiss}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-yellow-500 to-green-600 p-1">
          <div className="bg-white rounded-t-xl p-6 text-center">
            <div className="text-4xl mb-3">🏥🇬🇭</div>
            <h2 className="text-xl font-bold text-gray-900">GIHM-HIS</h2>
            <p className="text-sm text-gray-600 mt-1">Ghana's Complete Hospital Management System</p>
            <div className="flex justify-center gap-3 mt-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">300+ Modules</span>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">Free Trial</span>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="p-6">
          <p className="text-center text-sm text-gray-600 mb-4">Follow us for updates, tutorials & healthcare tips:</p>
          
          <div className="grid grid-cols-2 gap-3">
            <a href="https://web.facebook.com/shacomputecgh" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition border border-blue-200">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <div>
                <div className="text-sm font-bold text-blue-700">Facebook</div>
                <div className="text-[10px] text-blue-500">@shacomputec</div>
              </div>
            </a>
            
            <a href="https://tiktok.com/@shacomputecgh" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl bg-gray-900 hover:bg-gray-800 transition border border-gray-700">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.37-6.22V9.4a8.16 8.16 0 0 0 4.85 1.58V7.53a4.85 4.85 0 0 1-.99-.84z"/></svg>
              <div>
                <div className="text-sm font-bold text-white">TikTok</div>
                <div className="text-[10px] text-gray-400">@shacomputecgh</div>
              </div>
            </a>
            
            <a href="https://www.youtube.com/@shacomputec" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl bg-red-50 hover:bg-red-100 transition border border-red-200">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              <div>
                <div className="text-sm font-bold text-red-700">YouTube</div>
                <div className="text-[10px] text-red-500">Tutorials & Demos</div>
              </div>
            </a>
            
            <a href="https://whatsapp.com/channel/shacomputec" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition border border-green-200">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <div>
                <div className="text-sm font-bold text-green-700">WhatsApp</div>
                <div className="text-[10px] text-green-500">+233 530 941 750</div>
              </div>
            </a>
          </div>

          {/* Developer Info */}
          <div className="mt-4 p-3 bg-slate-50 rounded-xl text-center">
            <p className="text-xs text-slate-500">Developed by</p>
            <p className="text-sm font-bold text-slate-800">ShaComputeC</p>
            <p className="text-[10px] text-slate-400">📧 shacomputec@gmail.com · 📞 +233 530 941 750</p>
            <p className="text-[10px] text-slate-400 mt-1">Hard Works Never Fail</p>
          </div>

          {/* CTA */}
          <div className="mt-4 flex gap-2">
            <a href="/purchase" className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white text-center py-2.5 rounded-xl text-sm font-bold hover:from-red-700 hover:to-red-800 transition">
              💳 Buy Now
            </a>
            <a href="/activate" className="flex-1 border-2 border-green-600 text-green-700 text-center py-2.5 rounded-xl text-sm font-bold hover:bg-green-50 transition">
              🔑 Activate
            </a>
          </div>
        </div>

        {/* Dismiss */}
        <button onClick={dismiss} className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 border-t">
          ✕ Dismiss
        </button>
      </div>
    </div>
  );
}
