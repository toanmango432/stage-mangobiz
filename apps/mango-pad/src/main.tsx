import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './store';
import { App } from './App';
import './index.css';

declare global {
  interface Window {
    __REDUX_STORE__?: typeof store;
  }
}

if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
  window.__REDUX_STORE__ = store;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
