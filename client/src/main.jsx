import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import arEG from 'antd/locale/ar_EG';

import { store } from './redux/store';
import App from './App';
import './index.css';
import { HelmetProvider } from 'react-helmet-async';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ConfigProvider 
          locale={arEG}
          direction="rtl"
          theme={{
            token: {
              colorPrimary: '#2563eb',
              fontFamily: 'Cairo, sans-serif',
            },
          }}
        >
          <HelmetProvider>
            <App />
          </HelmetProvider>
        </ConfigProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);