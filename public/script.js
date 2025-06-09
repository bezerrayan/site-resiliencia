document.addEventListener('DOMContentLoaded', function() {
  // Dados das notícias (poderiam vir de uma API ou banco de dados)
  const noticias = [
    
  ];















  
  // Função para adicionar notícias dinamicamente
  const noticiasContainer = document.getElementById('noticias-container');

  noticias.forEach(noticia => {
    const divCard = document.createElement('div');
    divCard.classList.add('card');

    const h3 = document.createElement('h3');
    h3.textContent = noticia.titulo;

    const p = document.createElement('p');
    p.textContent = noticia.conteudo;

    divCard.appendChild(h3);
    divCard.appendChild(p);

    noticiasContainer.appendChild(divCard);
    
  });

  // Controle do carrossel
  const carousel = document.querySelector('.carousel-minimal');
  const slides = document.querySelectorAll('.carousel-slide-minimal');
  const prevBtn = document.querySelector('.carousel-arrow-minimal.prev');
  const nextBtn = document.querySelector('.carousel-arrow-minimal.next');
  const dotsContainer = document.querySelector('.carousel-dots-minimal');
  
  let currentSlide = 0;
  const slideCount = slides.length;
  let autoPlayInterval;

  // Limpa os dots existentes antes de criar
  dotsContainer.innerHTML = "";

  // Criar dots
  slides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.classList.add('dot-minimal');
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      clearInterval(autoPlayInterval);
      goToSlide(index);
      startAutoPlay();
    });
    dotsContainer.appendChild(dot);
  });

  const dots = dotsContainer.querySelectorAll('.dot-minimal');

  // Função para ir para um slide específico
  function goToSlide(index) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    currentSlide = index;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  }

  // Função para o próximo slide
  function nextSlide() {
    const next = (currentSlide + 1) % slideCount;
    goToSlide(next);
  }

  // Função para o slide anterior
  function prevSlide() {
    const prev = (currentSlide - 1 + slideCount) % slideCount;
    goToSlide(prev);
  }

  // Função para iniciar o auto-play
  function startAutoPlay() {
    clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(nextSlide, 5000);
  }

  // Event listeners para os botões
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      clearInterval(autoPlayInterval);
      nextSlide();
      startAutoPlay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      clearInterval(autoPlayInterval);
      prevSlide();
      startAutoPlay();
    });
  }

  // Pausar auto-play quando o mouse estiver sobre o carrossel
  if (carousel) {
    carousel.addEventListener('mouseenter', () => {
      clearInterval(autoPlayInterval);
    });
  }

  // Retomar auto-play quando o mouse sair do carrossel
  if (carousel) {
    carousel.addEventListener('mouseleave', () => {
      startAutoPlay();
    });
  }

  // Inicializar o primeiro slide e começar o auto-play
  goToSlide(0);
  startAutoPlay();

  // Adicionar animação aos botões do carrossel
  const carouselButtons = document.querySelectorAll('.carousel-btn');
  carouselButtons.forEach(button => {
    if (button) {
      button.addEventListener('mouseenter', function() {
        if (this) this.style.transform = 'translateY(-3px)';
      });
      
      button.addEventListener('mouseleave', function() {
        if (this) this.style.transform = 'translateY(0)';
      });
    }
  });

  // Dados dos jogos
  const gameData = {
    1: {
      title: "Final do Campeonato Regional",
      date: "15 de Março, 2024",
      time: "15:00",
      location: "Estádio Municipal",
      score: "Resiliência FC 3 x 1 Atlético Juventude",
      description: "Uma final emocionante onde nossa equipe mostrou garra e determinação do início ao fim. Destaque para a atuação do atacante Bruno Fernandes, autor de dois gols.",
      highlights: [
        "src/final1.jpg",
        "src/final2.jpg",
        "src/final3.jpg"
      ]
    },
    2: {
      title: "Semifinal - Jogo Decisivo",
      date: "10 de Março, 2024",
      time: "16:30",
      location: "Ginásio Poliesportivo",
      score: "Resiliência FC 2 x 2 Academia Futebol",
      description: "Jogo disputado até os últimos minutos, com nossa equipe garantindo a classificação nos pênaltis.",
      highlights: [
        "src/semifinal1.jpg",
        "src/semifinal2.jpg",
        "src/semifinal3.jpg"
      ]
    },
    3: {
      title: "Quartas de Final - Vitória Histórica",
      date: "5 de Março, 2024",
      time: "14:00",
      location: "Quadra da 214 Sul",
      score: "Resiliência FC 4 x 0 Brasília Futsal",
      description: "Vitória convincente que garantiu nossa classificação para as semifinais do campeonato.",
      highlights: [
        "src/quartas1.jpg",
        "src/quartas2.jpg",
        "src/quartas3.jpg"
      ]
    },
    4: {
      title: "Primeira Fase - Classificação",
      date: "1 de Março, 2024",
      time: "15:30",
      location: "CT Resiliência",
      score: "Resiliência FC 3 x 1 Esporte Clube",
      description: "Início promissor do campeonato com uma vitória importante em casa.",
      highlights: [
        "src/fase1.jpg",
        "src/fase2.jpg",
        "src/fase3.jpg"
      ]
    }
  };

  // Função para criar o conteúdo do modal
  function createModalContent(game) {
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    modalContent.innerHTML = `
        <span class="close-modal">&times;</span>
        <h2>${game.title}</h2>
        <div class="game-info">
            <p><i class="fas fa-calendar"></i> ${game.date}</p>
            <p><i class="fas fa-clock"></i> ${game.time}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${game.location}</p>
            <p><i class="fas fa-trophy"></i> ${game.score}</p>
        </div>
        <div class="game-description">
            <p>${game.description}</p>
        </div>
        <div class="game-highlights">
            <h3><i class="fas fa-images"></i> Momentos do Jogo</h3>
            <div class="highlights-gallery">
                ${game.highlights.map(img => `
                    <div class="highlight-container">
                        <img src="${img}" alt="Momento do jogo" onclick="toggleZoom(this)" loading="lazy">
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Adicionar evento de clique no botão de fechar
    const closeBtn = modalContent.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Remover zoom de todas as imagens
        document.querySelectorAll('.highlights-gallery img.zoomed').forEach(img => {
            img.classList.remove('zoomed');
        });
    });
    
    return modalContent;
  }

  // Função para alternar o zoom das imagens
  function toggleZoom(img) {
    img.classList.toggle('zoomed');
    if (img.classList.contains('zoomed')) {
      img.style.cursor = 'zoom-out';
    } else {
      img.style.cursor = 'zoom-in';
    }
  }

  // Adicionar evento de clique fora da imagem para fechar o zoom
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('zoomed')) {
      e.target.classList.remove('zoomed');
      e.target.style.cursor = 'zoom-in';
    }
  });

  // Eventos dos botões "Ver Detalhes"
  if (carouselButtons) {
    carouselButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const slideId = btn.getAttribute('data-slide');
        const game = gameData[slideId];
        if (game) {
          const modalContent = createModalContent(game);
          modal.innerHTML = '';
          modal.appendChild(modalContent);
          modal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    });
  }

  // Fechar modal ao clicar fora
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Remover zoom de todas as imagens
        document.querySelectorAll('.gallery-img.zoomed').forEach(img => {
          img.classList.remove('zoomed');
        });
      }
    });
  }

  // Fechar modal com tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      // Remover zoom de todas as imagens
      document.querySelectorAll('.gallery-img.zoomed').forEach(img => {
        img.classList.remove('zoomed');
      });
    }
  });

  // Adicionar estilos CSS dinamicamente para o modal
  const style = document.createElement('style');
  style.textContent = `
    .game-info {
      margin: 1.5rem 0;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .game-description {
      margin: 1.5rem 0;
    }

    .highlights-gallery {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .highlights-gallery img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.3s ease;
    }

    .highlights-gallery img:hover {
      transform: scale(1.05);
    }

    @media (max-width: 768px) {
      .lineups {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);

  // --- Carrossel Minimalista FULL WIDTH --- //
  const slidesFull = document.querySelectorAll('.carousel-slide-minimal');
  const prevBtnFull = document.querySelector('.carousel-arrow-minimal.prev');
  const nextBtnFull = document.querySelector('.carousel-arrow-minimal.next');
  const dotsContainerFull = document.querySelector('.carousel-dots-minimal');
  let currentFull = 0;
  let intervalFull;

  // Criar dots
  dotsContainerFull.innerHTML = '';
  slidesFull.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.classList.add('dot-minimal');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      goToSlideFull(i);
      resetIntervalFull();
    });
    dotsContainerFull.appendChild(dot);
  });
  const dotsFull = dotsContainerFull.querySelectorAll('.dot-minimal');

  function goToSlideFull(idx) {
    slidesFull[currentFull].classList.remove('active');
    dotsFull[currentFull].classList.remove('active');
    currentFull = idx;
    slidesFull[currentFull].classList.add('active');
    dotsFull[currentFull].classList.add('active');
  }
  function nextSlideFull() {
    goToSlideFull((currentFull + 1) % slidesFull.length);
  }
  function prevSlideFull() {
    goToSlideFull((currentFull - 1 + slidesFull.length) % slidesFull.length);
  }
  function resetIntervalFull() {
    clearInterval(intervalFull);
    intervalFull = setInterval(nextSlideFull, 5000);
  }
  if (nextBtnFull && prevBtnFull) {
    nextBtnFull.addEventListener('click', () => { nextSlideFull(); resetIntervalFull(); });
    prevBtnFull.addEventListener('click', () => { prevSlideFull(); resetIntervalFull(); });
  }
  // Iniciar
  goToSlideFull(0);
  intervalFull = setInterval(nextSlideFull, 5000);

  // Dados dos slides com detalhes completos
  const slidesData = {
    'formando-atletas': {
      titulo: 'Formando Atletas e Cidadãos',
      descricao: 'Desenvolvimento completo através do esporte, formando não apenas atletas, mas cidadãos de bem.',
      detalhes: `
        <div class="modal-content-grid">
          <div class="modal-info-section">
            <h3>Nossa Metodologia</h3>
            <ul>
              <li>Desenvolvimento técnico personalizado</li>
              <li>Acompanhamento psicológico</li>
              <li>Formação cidadã e valores éticos</li>
              <li>Integração com a família</li>
            </ul>
          </div>
          <div class="modal-info-section">
            <h3>Resultados</h3>
            <ul>
              <li>Mais de 500 atletas formados</li>
              <li>Parcerias com clubes profissionais</li>
              <li>Reconhecimento nacional</li>
            </ul>
          </div>
        </div>
      `
    },
    'todas-idades': {
      titulo: 'Turmas para Todas as Idades',
      descricao: 'Treinamento especializado para cada faixa etária.',
      detalhes: `
        <div class="modal-content-grid">
          <div class="modal-info-section">
            <h3>Categorias</h3>
            <ul>
              <li>Sub-7: Iniciação ao futebol</li>
              <li>Sub-9: Desenvolvimento motor</li>
              <li>Sub-11: Fundamentos técnicos</li>
              <li>Sub-13: Tática básica</li>
              <li>Sub-15: Aperfeiçoamento</li>
            </ul>
          </div>
          <div class="modal-info-section">
            <h3>Horários</h3>
            <ul>
              <li>Manhã: 8h às 11h</li>
              <li>Tarde: 14h às 17h</li>
              <li>Noite: 18h às 21h</li>
            </ul>
          </div>
        </div>
      `
    },
    'estrutura': {
      titulo: 'Estrutura Completa',
      descricao: 'Infraestrutura de primeira linha para nossos atletas.',
      detalhes: `
        <div class="modal-content-grid">
          <div class="modal-info-section">
            <h3>Instalações</h3>
            <ul>
              <li>2 campos oficiais</li>
              <li>Campo society</li>
              <li>Academia equipada</li>
              <li>Vestiários modernos</li>
            </ul>
          </div>
          <div class="modal-info-section">
            <h3>Equipamentos</h3>
            <ul>
              <li>Material esportivo profissional</li>
              <li>Equipamentos de treino</li>
              <li>Área de recuperação</li>
            </ul>
          </div>
        </div>
      `
    },
    'conquistas': {
      titulo: 'Resultados e Conquistas',
      descricao: 'Nossa história é construída com dedicação, suor e vitórias.',
      detalhes: `
        <div class="modal-content-grid">
          <div class="modal-info-section">
            <h3>Títulos Recentes</h3>
            <ul>
              <li>Campeão Regional Sub-15 2024</li>
              <li>Vice-campeão Estadual Sub-13 2024</li>
              <li>Campeão da Copa Cidade Sub-11 2023</li>
            </ul>
          </div>
          <div class="modal-info-section">
            <h3>Destaques</h3>
            <ul>
              <li>5 atletas em clubes profissionais</li>
              <li>15 convocações para seleções de base</li>
              <li>Melhor escola de futebol 2023</li>
            </ul>
          </div>
        </div>
      `
    }
  };

  // Adicionar event listeners para os botões "Ver mais"
  document.querySelectorAll('.carousel-btn-more').forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const slideId = Object.keys(slidesData)[index];
      showDetails(slideId);
    });
  });

  // Função para mostrar o modal com detalhes
  function showDetails(slideId) {
    const data = slidesData[slideId];
    const modal = document.getElementById('gameModal');
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
      <span class="close-modal">&times;</span>
      <h2>${data.titulo}</h2>
      <p class="modal-description">${data.descricao}</p>
      ${data.detalhes}
    `;

    modal.style.display = 'block';

    // Fechar modal ao clicar no X
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    // Fechar modal ao clicar fora dele
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
}); 

// Inicializa o botão de login do Google
window.onload = function () {
  google.accounts.id.initialize({
    client_id: "387015858940-4vvdsandi9n2m8f36hak53j2emki2dfg.apps.googleusercontent.com", // substitua aqui
  callbackURL: "https://site-resiliencia.onrender.com/auth/google/callback"


  });

  google.accounts.id.renderButton(
    document.getElementById("googleLoginBtn"),
    {
      theme: "outline",
      size: "large",
      width: 300
    }
  );
};

function handleCredentialResponse(response) {
  // Decodifica o token JWT se quiser ver os dados do usuário
  const data = parseJwt(response.credential);
  console.log("Usuário logado com Google:", data);

  // Redireciona pro painel
  window.location.href = "dashboard.html";
}

// Função auxiliar para ler os dados do JWT
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}
