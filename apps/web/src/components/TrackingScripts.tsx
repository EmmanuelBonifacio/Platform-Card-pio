'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

type Tracking = {
  metaPixelId?: string | null;
  gaMeasurementId?: string | null;
  gtmContainerId?: string | null;
};

export function TrackingScripts({ slug }: { slug: string }) {
  const [t, setT] = useState<Tracking | null>(null);

  useEffect(() => {
    void apiGet<Tracking>(`/public/${slug}/tracking`)
      .then(setT)
      .catch(() => setT(null));
  }, [slug]);

  if (!t) return null;

  return (
    <>
      {t.gtmContainerId ? (
        <Script id="gtm" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${t.gtmContainerId}');
        `}</Script>
      ) : null}
      {t.gaMeasurementId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${t.gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${t.gaMeasurementId}');
          `}</Script>
        </>
      ) : null}
      {t.metaPixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${t.metaPixelId}');
          fbq('track', 'PageView');
        `}</Script>
      ) : null}
    </>
  );
}
