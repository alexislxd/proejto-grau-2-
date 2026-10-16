import { useEffect, useRef, useState } from 'react';

type VimeoPlayer = {
  ready: () => Promise<void>;
  setCurrentTime: (seconds: number) => Promise<number>;
  setMuted: (muted: boolean) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  play: () => Promise<void>;
  on: (event: 'ended', callback: () => void) => void;
  off: (event: 'ended', callback: () => void) => void;
  destroy: () => Promise<void>;
};

type VimeoWindow = Window & {
  Vimeo?: {
    Player: new (target: HTMLIFrameElement) => VimeoPlayer;
  };
};

function loadVimeoApi(): Promise<NonNullable<VimeoWindow['Vimeo']>> {
  const vimeoWindow = window as VimeoWindow;

  if (vimeoWindow.Vimeo) {
    return Promise.resolve(vimeoWindow.Vimeo);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.async = true;
    script.onload = () => {
      if (vimeoWindow.Vimeo) {
        resolve(vimeoWindow.Vimeo);
      } else {
        reject(new Error('O player do Vimeo não ficou disponível.'));
      }
    };
    script.onerror = () => reject(new Error('Não foi possível carregar o player do Vimeo.'));
    document.head.append(script);
  });
}

function App() {
  const videoFrameRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<VimeoPlayer | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    document.title = 'Projeto Grau 2 — Conheça o jogo';
  }, []);

  useEffect(() => {
    const iframe = videoFrameRef.current;
    if (!iframe) return;

    let isMounted = true;
    let player: VimeoPlayer | null = null;

    const handleVideoEnded = async () => {
      const currentPlayer = player;
      if (!currentPlayer || !isMounted) return;

      try {
        await currentPlayer.setMuted(true);
      } catch {
        // Still restart the video and show the sound button if muting fails.
      }

      if (!isMounted) return;
      setSoundEnabled(false);

      try {
        await currentPlayer.setCurrentTime(0);
        await currentPlayer.play();
      } catch {
        // Keep Vimeo's native controls available if restarting fails.
      }
    };

    void loadVimeoApi()
      .then((vimeo) => {
        if (!isMounted) return;
        const instance = new vimeo.Player(iframe);
        player = instance;
        playerRef.current = instance;
        return instance.ready().then(() => {
          if (isMounted) instance.on('ended', handleVideoEnded);
        });
      })
      .catch(() => {
        // The Vimeo player's own controls remain available if its API cannot load.
      });

    return () => {
      isMounted = false;
      playerRef.current = null;
      if (player) {
        player.off('ended', handleVideoEnded);
        void player.destroy().catch(() => {});
      }
    };
  }, []);

  const handleEnableSound = async () => {
    const player = playerRef.current;
    if (!player) return;

    try {
      // Send the commands during the click so browsers still recognize the
      // interaction that allows audible playback.
      const seekToStart = player.setCurrentTime(0);
      const unmute = player.setMuted(false);
      const setFullVolume = player.setVolume(1);
      const resumePlayback = player.play();

      void Promise.all([seekToStart, resumePlayback]).catch(() => {});
      await Promise.all([unmute, setFullVolume]);
      setSoundEnabled(true);
    } catch {
      // The Vimeo player's own controls remain available if sound activation fails.
    }
  };

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <div className="site-shell">
        <header className="site-header">
          <a className="brand" href="#inicio" aria-label="Projeto Grau 2, voltar ao início">
            <span className="brand__icon">
              <img src="/assets/logo-pg2.webp" alt="" width="48" height="48" fetchPriority="high" />
            </span>
            <span className="brand__name">PROJETO <strong>GRAU 2</strong><small>INSANITY GROUP</small></span>
          </a>
          <span className="site-header__note"><span className="status-dot" aria-hidden="true" /> VIVA O JOGO</span>
        </header>

        <main id="conteudo">
          <section className="hero" id="inicio" aria-labelledby="hero-title">
            <div className="hero__content">
              <p className="eyebrow"><span className="eyebrow__line" aria-hidden="true" /> ENTRE NO UNIVERSO PG2</p>
              <h1 id="hero-title">PROJETO<br /><span>GRAU 2<span className="hero__period">.</span></span></h1>
              <p className="hero__lead">Seu próximo rolê começa aqui.</p>
              <p className="hero__description">Viva cada manobra, personalize sua moto e conheça o universo do Projeto Grau 2.</p>

              <div className="hero__video-shell">
                <iframe
                  ref={videoFrameRef}
                  id="hero-video-frame"
                  className="hero__video"
                  src="https://player.vimeo.com/video/1236617709?autoplay=1&muted=1&controls=1&title=0&byline=0&portrait=0&playsinline=1"
                  title="Vídeo vertical de apresentação do Projeto Grau 2"
                  loading="eager"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  allowFullScreen
                />
                {!soundEnabled && (
                  <div className="hero__sound-overlay">
                    <button
                      className="hero__sound-button"
                      type="button"
                      onClick={handleEnableSound}
                      aria-label="Ativar o som do vídeo do Projeto Grau 2"
                    >
                      <strong>ATIVAR O SOM</strong>
                    </button>
                  </div>
                )}
              </div>
              <a className="hero__cta" href="#offer-title" aria-label="Baixar agora — ir para a oferta do Projeto Grau 2">
                BAIXAR AGORA
              </a>
            </div>
            <div className="hero__index" aria-hidden="true">01 / 06</div>
          </section>

          <section className="benefits" aria-labelledby="benefits-title">
            <div className="benefits__intro">
              <div>
                <p className="eyebrow"><span className="eyebrow__line" aria-hidden="true" /> UMA EXPERIÊNCIA COMPLETA</p>
                <h2 id="benefits-title">O QUE VOCÊ<br /><span>VAI RECEBER?</span></h2>
              </div>
              <p>Um mundo aberto de motos, manobras e personalização para você jogar do seu jeito.</p>
            </div>
            <div className="benefits__grid">
              <article className="benefit-card">
                <span className="benefit-card__number">01</span>
                <p className="benefit-card__eyebrow">O JOGO PROJETO GRAU 2</p>
                <h3>Você vai receber o Projeto Grau 2</h3>
                <p>A oferta inclui o jogo Projeto Grau 2, com manobras, cidade aberta, motos e personalização.</p>
              </article>
              <article className="benefit-card">
                <span className="benefit-card__number">02</span>
                <p className="benefit-card__eyebrow">CIDADE ABERTA</p>
                <h3>Explore cada rua</h3>
                <p>Rode por uma cidade viva, com trânsito, semáforos, dia e noite e diferentes condições de clima.</p>
              </article>
              <article className="benefit-card">
                <span className="benefit-card__number">03</span>
                <p className="benefit-card__eyebrow">GARAGEM E OFICINA</p>
                <h3>Deixe com a sua cara</h3>
                <p>Personalize motos com rodas, pneus, suspensão, pintura e peças. Depois, escolha seu próximo rolê.</p>
              </article>
              <article className="benefit-card">
                <span className="benefit-card__number">04</span>
                <p className="benefit-card__eyebrow">TRAMPOS E PROGRESSÃO</p>
                <h3>Ganhe seu dinheiro no jogo</h3>
                <p>Faça entregas e outros trabalhos pela cidade para conquistar novos veículos e continuar avançando.</p>
              </article>
            </div>
          </section>

          <section className="game-gallery" aria-labelledby="game-gallery-title">
            <div className="game-gallery__intro">
              <div>
                <p className="eyebrow"><span className="eyebrow__line" aria-hidden="true" /> O UNIVERSO DO JOGO</p>
                <h2 id="game-gallery-title">A RUA É <span>SUA.</span></h2>
              </div>
              <p>Viva cada manobra e monte seu estilo no Projeto Grau 2.</p>
            </div>
            <div className="game-gallery__grid">
              <figure className="game-gallery__card">
                <img
                  src="/assets/render-grau.webp"
                  srcSet="/assets/render-grau-800.webp 800w, /assets/render-grau.webp 1440w"
                  sizes="(max-width: 700px) calc(100vw - 40px), 50vw"
                  alt="Personagem empinando uma moto em uma rua ao pôr do sol no Projeto Grau 2"
                  width="1440"
                  height="1225"
                  loading="lazy"
                  decoding="async"
                />
                <figcaption><span>01 / MANOBRAS</span><strong>DOMINE O GRAU</strong></figcaption>
              </figure>
              <figure className="game-gallery__card">
                <img
                  src="/assets/render-moto.webp"
                  srcSet="/assets/render-moto-800.webp 800w, /assets/render-moto.webp 1440w"
                  sizes="(max-width: 700px) calc(100vw - 40px), 50vw"
                  alt="Personagem posando ao lado de uma moto vermelha no Projeto Grau 2"
                  width="1440"
                  height="1225"
                  loading="lazy"
                  decoding="async"
                />
                <figcaption><span>02 / ESTILO</span><strong>FAÇA DO SEU JEITO</strong></figcaption>
              </figure>
            </div>
          </section>

          <section className="offer" aria-labelledby="offer-title">
            <div className="offer__card">
              <div className="offer__card-heading">
                <p>OFERTA EXCLUSIVA</p>
                <h3 id="offer-title">PROJETO GRAU 2</h3>
                <span aria-hidden="true" />
              </div>
              <p className="offer__list-title">O QUE VOCÊ VAI RECEBER:</p>
              <ul className="offer__items">
                <li>O jogo Projeto Grau 2</li>
                <li>Cidade aberta para explorar</li>
                <li>Manobras, motos e veículos</li>
                <li>Garagem e personalização</li>
              </ul>
              <div className="offer__checkout">
                <span className="offer__label">VALOR DA OFERTA</span>
                <p className="offer__old-price">De <del>R$ 25,00</del></p>
                <p className="offer__price"><span>R$</span> 7,90</p>
                <a className="offer__button" href="https://pay.lowify.com.br/checkout?product_id=I9CzQT" aria-label="Baixar Projeto Grau 2 por R$ 7,90">
                  BAIXAR
                </a>
                <p className="offer__note">Oferta própria, fora das lojas oficiais. O botão abre o checkout para concluir a compra.</p>
              </div>
            </div>
          </section>

          <section className="testimonials" aria-labelledby="testimonials-title">
            <div className="testimonials__intro">
              <p className="eyebrow"><span className="eyebrow__line" aria-hidden="true" /> VOZ DA COMUNIDADE</p>
              <h2 id="testimonials-title">QUEM BAIXOU,<br /><span>APROVOU.</span></h2>
              <p>Comentários de quem já joga Projeto Grau 2.</p>
            </div>
            <div className="testimonials__content">
              <div className="review-quotes">
                <blockquote className="review-card">
                  <span className="review-card__quote-mark" aria-hidden="true">“</span>
                  <p>“Jogo top sem palavras! ... cada moto ter seu barulho ... O jogo tá top só manter desse jeito com qualidade vai longe!”</p>
                  <cite>Comentário de jogador</cite>
                </blockquote>
                <blockquote className="review-card">
                  <span className="review-card__quote-mark" aria-hidden="true">“</span>
                  <p>“muito lindo amei 👏🏾 parabéns”</p>
                  <cite>Comentário de jogador</cite>
                </blockquote>
              </div>
            </div>
          </section>

          <section className="faq" aria-labelledby="faq-title">
            <div className="faq__intro">
              <p className="eyebrow"><span className="eyebrow__line" aria-hidden="true" /> TIRE SUAS DÚVIDAS</p>
              <h2 id="faq-title">PERGUNTAS<br /><span>FREQUENTES.</span></h2>
              <p>Informações rápidas sobre o jogo e a oferta.</p>
            </div>
            <div className="faq__list">
              <details className="faq__item">
                <summary>O que vou receber?</summary>
                <div className="faq__answer"><p>Você vai receber o Projeto Grau 2, com cidade aberta, manobras de moto, veículos e personalização.</p></div>
              </details>
              <details className="faq__item">
                <summary>Quanto custa a oferta?</summary>
                <div className="faq__answer"><p>O valor atual é R$ 7,90. O card também mostra o valor anterior de R$ 25,00.</p></div>
              </details>
              <details className="faq__item">
                <summary>Como faço para baixar?</summary>
                <div className="faq__answer"><p>Toque em “BAIXAR” no card da oferta para abrir o checkout e siga as instruções da página.</p></div>
              </details>
              <details className="faq__item">
                <summary>O que tem no jogo?</summary>
                <div className="faq__answer"><p>Explore uma cidade aberta, faça manobras, escolha veículos e personalize sua garagem.</p></div>
              </details>
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <div className="site-footer__brand"><span>PG<span>2</span></span> PROJETO GRAU 2</div>
          <p>© <span>{new Date().getFullYear()}</span> Insanity Group. Todos os direitos reservados.</p>
          <a href="#inicio">VOLTAR AO TOPO ↑</a>
        </footer>
      </div>
    </>
  );
}

export default App;
