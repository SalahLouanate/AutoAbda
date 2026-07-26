import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

console.log('Diagnostic Clé Reverb :', import.meta.env.VITE_REVERB_APP_KEY);

const apiKey = import.meta.env.VITE_REVERB_APP_KEY || 'kvughiwxmyijgenffy9y';

const echo = new Echo({
  broadcaster: 'reverb',
  key: apiKey,
  wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
  wsPort: import.meta.env.VITE_REVERB_PORT ? Number(import.meta.env.VITE_REVERB_PORT) : 8080,
  wssPort: import.meta.env.VITE_REVERB_PORT ? Number(import.meta.env.VITE_REVERB_PORT) : 8080,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
});

window.Echo = echo;

export default echo;
