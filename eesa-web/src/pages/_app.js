import Head from 'next/head'
import '@/styles/globals.scss'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'regenerator-runtime/runtime';
import 'react-toastify/dist/ReactToastify.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>EESA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
