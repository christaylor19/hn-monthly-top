/* @refresh reload */
import { render } from 'solid-js/web';
import { inject } from '@vercel/analytics';
import './index.css';
import App from './App';

// Vercel Web Analytics. No Solid-specific binding exists, so we use the
// framework-agnostic vanilla entry: inject() once at boot wires up automatic
// pageviews and enables track() for custom events (see api/summarise.js).
inject();

render(() => <App />, document.getElementById('root'));
