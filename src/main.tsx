import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { KeyGate } from './components/KeyGate';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KeyGate appName="Read with Me AI">
      <App />
    </KeyGate>
  </StrictMode>,
);
