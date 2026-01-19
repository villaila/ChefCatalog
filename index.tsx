
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("No se encontró el elemento root");
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("App renderizada correctamente");
  } catch (error) {
    console.error("Error crítico durante el renderizado:", error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">Error al cargar la aplicación. Por favor, revisa la consola del navegador.</div>`;
  }
};

mountApp();
