import React, { useEffect } from 'react';

export default function WaitlistEmbed({ tallyUrl = 'https://tally.so/r/w40MgA?hideTitle=1' }) {
  const embedUrl = tallyUrl.includes('?') ? tallyUrl : `${tallyUrl}?hideTitle=1`;

  useEffect(() => {
    const existingScript = document.querySelector('script[src="https://tally.so/widgets/embed.js"]');
    if (existingScript) {
      window.Tally?.loadEmbeds?.();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://tally.so/widgets/embed.js';
    script.async = true;
    script.onload = () => window.Tally?.loadEmbeds?.();
    document.body.appendChild(script);
  }, []);

  return (
    <div className="relative rounded-3xl bg-white shadow-2xl overflow-hidden">
      <iframe
        title="PickMySet waitlist"
        src={embedUrl}
        loading="lazy"
        width="100%"
        height="520"
        className="w-full h-[520px] bg-transparent"
        frameBorder="0"
        marginHeight="0"
        marginWidth="0"
        allow="clipboard-write; fullscreen"
      />
    </div>
  );
}
