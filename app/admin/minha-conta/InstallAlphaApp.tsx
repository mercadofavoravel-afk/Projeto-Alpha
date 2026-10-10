'use client';

import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallAlphaApp() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  return (
    <section className="admin-card" aria-label="Acesso pelo celular">
      <h2>Alpha no celular</h2>
      {installed ? (
        <p>O painel está aberto como aplicativo neste aparelho.</p>
      ) : (
        <>
          <p>
            Use o mesmo e-mail e senha da sua conta no Android ou no iPhone. O aplicativo precisa de
            conexão com a internet para acessar o CRM e publicar conteúdo.
          </p>
          {promptEvent && (
            <button className="btn" type="button" onClick={install}>
              Instalar Alpha neste aparelho
            </button>
          )}
          <p>
            Android: abra o menu do navegador e escolha “Instalar app” ou “Adicionar à tela
            inicial”. iPhone: abra no Safari, toque em Compartilhar e escolha “Adicionar à Tela de
            Início”.
          </p>
        </>
      )}
    </section>
  );
}
