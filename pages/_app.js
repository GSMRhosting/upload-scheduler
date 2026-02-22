import Head from 'next/head'
export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Upload Scheduler</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #0d0d0f; font-family: 'Georgia', serif; }
          input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: #111; }
          ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        `}</style>
      </Head>
      <Component {...pageProps} />
    </>
  )
}
