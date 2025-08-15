
 document.addEventListener('DOMContentLoaded', () => {
     
         document.querySelectorAll('a[target="_blank"]').forEach(a => {
      if (!/\bnoopener\b/.test(a.rel) || !/\bnoreferrer\b/.test(a.rel)) {
        a.rel = 'noopener noreferrer';
      }
    });
      const nameEl = document.getElementById('nome');
      const dynamicGradientAnimations = new Map();

      function startDynamicGradientAnimation(element) {
        let animState = dynamicGradientAnimations.get(element);
        if (!animState) {
          animState = { rafId: null, angle: 0, spinning: false };
          dynamicGradientAnimations.set(element, animState);
        }
        if (animState.spinning) return;
        animState.angle = 0;
        element.style.setProperty('--angle', '0deg');
        animState.spinning = true;
        function frame() {
          if (!animState.spinning) return;
          animState.angle = (animState.angle + 6) % 360;
          element.style.setProperty('--angle', animState.angle + 'deg');
          animState.rafId = requestAnimationFrame(frame);
        }
        frame();
        element.classList.add('radial');
      }

      function stopDynamicGradientAnimation(element) {
        let animState = dynamicGradientAnimations.get(element);
        if (animState) {
          animState.spinning = false;
          if (animState.rafId) cancelAnimationFrame(animState.rafId);
          animState.rafId = null;
          element.classList.remove('radial');
          element.style.backgroundPosition = '0% 50%';
        }
      }

      function handleDynamicGradientMouseMove(element, e) {
        const rect = element.getBoundingClientRect();
        const cx = ((e.clientX - rect.left) / rect.width) * 100;
        const cy = ((e.clientY - rect.top) / rect.height) * 100;
        element.style.setProperty('--cx', cx + '%');
        element.style.setProperty('--cy', cy + '%');
      }

      const profileCardElement = document.getElementById('profileCard');
      profileCardElement.addEventListener('mouseenter', () => startDynamicGradientAnimation(nameEl));
      profileCardElement.addEventListener('mousemove', (e) => handleDynamicGradientMouseMove(nameEl, e));
      profileCardElement.addEventListener('mouseleave', () => stopDynamicGradientAnimation(nameEl));
      
      nameEl.addEventListener('mouseenter', () => startDynamicGradientAnimation(nameEl));
      nameEl.addEventListener('mousemove', (e) => handleDynamicGradientMouseMove(nameEl, e));
      nameEl.addEventListener('mouseleave', (e) => {
        if (!profileCardElement.contains(e.relatedTarget)) {
          stopDynamicGradientAnimation(nameEl);
        }
      });
      
      window.addEventListener('scroll', () => {
        if (!nameEl.classList.contains('radial')) {
          const max = document.documentElement.scrollHeight - window.innerHeight;
          const pct = (window.scrollY / max) * 100;
          nameEl.style.backgroundPosition = `${pct}% 50%`;
        }
      });

const nav = document.querySelector('header');
let lastY  = window.scrollY;
let hideTO = null;

      //underline dinâmico da navbar (temporariamente desativado para manutenção)
//const navList   = document.querySelector('header nav ul');
//const underline = document.createElement('span');
//underline.className = 'nav-underline';
//navList.style.position = 'relative';
//navList.appendChild(underline);

// define posição inicial (1º item)
//moveUnderline(navList.querySelector('a'));

//navList.addEventListener('click', e=>{
//   const link = e.target.closest('a');
//   if(!link) return;
//   moveUnderline(link);
//});
// se quiser que o “raio” siga também no hover, habilite a linha abaixo
//navList.addEventListener('mouseover', e=>{
//   const link = e.target.closest('a'); if(link) moveUnderline(link);
//});

//function moveUnderline(link){
//   const rectLink = link.getBoundingClientRect();
//   const rectList = navList.getBoundingClientRect();
//   underline.style.width = rectLink.width + 'px';
//   underline.style.transform =
//        `translateX(${link.offsetLeft}px)`;
//}

window.addEventListener('scroll', () => {
  const curY = window.scrollY;

  if (curY > lastY + 16) {
    clearTimeout(hideTO);
    hideTO = setTimeout(()=> nav.classList.add('nav-hidden'), 250); 
    lastY = curY;
  } else if (curY < lastY - 16) {
    nav.classList.remove('nav-hidden');  
    lastY = curY;
  }
});

      //Lógica do Carrossel 
      const carouselContainer = document.querySelector('.carousel-container');
      const carouselTrack = document.getElementById('serverCarouselTrack');
      const prevButton = document.getElementById('carouselPrev');
      const nextButton = document.getElementById('carouselNext');
      if(carouselTrack) {
        let originalServerCards = Array.from(document.querySelectorAll('#serverCarouselTrack > .server-card'));
        let serverCards = [];
        let currentIndex = 0;
        let isTransitioning = false;
        let autoScrollInterval;
        let preClones = 1;
        let postClones = 1;

        function setupInfiniteCarousel() {
            if (originalServerCards.length === 0) return;
            const preClone = originalServerCards[originalServerCards.length - 1].cloneNode(true);
            const postClone = originalServerCards[0].cloneNode(true);
            carouselTrack.innerHTML = '';
            carouselTrack.appendChild(preClone);
            originalServerCards.forEach(c => carouselTrack.appendChild(c.cloneNode(true)));
            carouselTrack.appendChild(postClone);
            serverCards = Array.from(carouselTrack.children);
            currentIndex = preClones;
            updateCarousel(true);
        }

        function updateCarousel(instant = false) {
            if (isTransitioning && !instant) return;
            if (instant) {
                carouselTrack.style.transition = 'none';
            } else {
                carouselTrack.style.transition = 'transform 0.5s ease-in-out';
                isTransitioning = true;
            }
            serverCards.forEach((card, index) => {
                card.classList.remove('is-center', 'is-left', 'is-right');
                if (index === currentIndex) card.classList.add('is-center');
                else if (index === (currentIndex - 1 + serverCards.length) % serverCards.length) card.classList.add('is-left');
                else if (index === (currentIndex + 1) % serverCards.length) card.classList.add('is-right');
            });
            
const currentCentralCard = serverCards[currentIndex];

const containerRect  = carouselContainer.getBoundingClientRect();
const cardRect       = currentCentralCard.getBoundingClientRect();

const delta = (containerRect.left + containerRect.width / 2) -
              (cardRect.left     + cardRect.width     / 2);

const m            = new (window.DOMMatrixReadOnly || window.WebKitCSSMatrix)(
                       getComputedStyle(carouselTrack).transform
                     );
const curTranslate = m.m41;   

const translateXValue = curTranslate + delta;
carouselTrack.style.transform = `translateX(${translateXValue}px)`;

            carouselTrack.style.transform = `translateX(${translateXValue}px)`;
            if (!instant) {
              setTimeout(() => { isTransitioning = false; }, 500);
            }
        }

        carouselTrack.addEventListener('transitionend', e => {
            if (e.propertyName !== 'transform') return;
            isTransitioning = false;
            let needSnap = false;
            if (currentIndex >= serverCards.length - postClones) {
                currentIndex = preClones;
                needSnap = true;
            } else if (currentIndex < preClones) {
                currentIndex = serverCards.length - postClones - preClones;
                needSnap = true;
            }
            if (needSnap) {
                carouselTrack.style.transition = 'none';
                updateCarousel(true);
                void carouselTrack.offsetWidth;
                carouselTrack.style.transition = 'transform 0.5s ease-in-out';
            }
        });
        
        nextButton.addEventListener('click', () => { if (!isTransitioning) { currentIndex++; updateCarousel(); } });
        prevButton.addEventListener('click', () => { if (!isTransitioning) { currentIndex--; updateCarousel(); } });
        
        const startAutoScroll = () => { stopAutoScroll(); autoScrollInterval = setInterval(() => nextButton.click(), 6000); };
        const stopAutoScroll = () => clearInterval(autoScrollInterval);

        carouselContainer.addEventListener('mouseenter', stopAutoScroll);
        carouselContainer.addEventListener('mouseleave', startAutoScroll);
        window.addEventListener('resize', setupInfiniteCarousel);
        setupInfiniteCarousel();
        startAutoScroll();
      }

      (() => {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Particles
        const particlesCount = 300;
        const positions = new Float32Array(particlesCount * 3);
        for (let i = 0; i < particlesCount; i++) {
          positions[i * 3 + 0] = (Math.random() - 0.5) * 10; // x
          positions[i * 3 + 1] = (Math.random() - 0.5) * 10; // y
          positions[i * 3 + 2] = (Math.random() - 0.5) * 10; // z
        }
        const particlesGeometry = new THREE.BufferGeometry();
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particlesMaterial = new THREE.PointsMaterial({
          color: 0x99AAB5,
          size: 0.03,
          blending: THREE.AdditiveBlending,
          transparent: true,
          sizeAttenuation: true
        });
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);

        // Lines
        const linesGeometry = new THREE.BufferGeometry();
        const linesMaterial = new THREE.LineBasicMaterial({
          color: 0x7289DA,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending
        });
        const linePositions = new Float32Array(particlesCount * particlesCount * 3);
        linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
        scene.add(lines);

        camera.position.z = 5;

        // Mouse tracking
        const mouse = new THREE.Vector2();
        window.addEventListener('mousemove', (event) => {
          mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
          mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        // Resize handler
        window.addEventListener('resize', () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });
        
        const clock = new THREE.Clock();

        function animateThree() {
          const elapsedTime = clock.getElapsedTime();
          particles.rotation.y = elapsedTime * 0.05;
          particles.rotation.x = elapsedTime * 0.05;
          
          const scrollY = window.scrollY;
          const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercent = scrollY / scrollMax;
          camera.position.z = 5 - scrollPercent * 4;
          camera.position.y = -scrollPercent * 2;

          camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.02;
          camera.position.y += (-mouse.y * 0.5 - camera.position.y) * 0.02;
          camera.lookAt(scene.position);
          
          let lineVertexIndex = 0;
          const particlePositions = particles.geometry.attributes.position.array;
          const maxDistSq = 1 * 1; 
          for (let i = 0; i < particlesCount; i++) {
            for (let j = i + 1; j < particlesCount; j++) {
                const ix = particlePositions[i * 3];
                const iy = particlePositions[i * 3 + 1];
                const iz = particlePositions[i * 3 + 2];
                const jx = particlePositions[j * 3];
                const jy = particlePositions[j * 3 + 1];
                const jz = particlePositions[j * 3 + 2];
                const dx = ix - jx;
                const dy = iy - jy;
                const dz = iz - jz;
                const distSq = dx*dx + dy*dy + dz*dz;

                if (distSq < maxDistSq) {
                    linePositions[lineVertexIndex++] = ix;
                    linePositions[lineVertexIndex++] = iy;
                    linePositions[lineVertexIndex++] = iz;
                    linePositions[lineVertexIndex++] = jx;
                    linePositions[lineVertexIndex++] = jy;
                    linePositions[lineVertexIndex++] = jz;
                }
            }
          }
          lines.geometry.attributes.position.needsUpdate = true;
          // Important: only draw the lines that were updated
          lines.geometry.setDrawRange(0, lineVertexIndex / 3);

          renderer.render(scene, camera);
          requestAnimationFrame(animateThree);
        }
        animateThree();
      })();

      (() => {
        const container = document.getElementById('skills-constellation-container');
        if (!container) return;

        const skillsData = {
            nodes: [
                { id: "Programação", group: "core" },
                { id: "Python", group: "language" },
                { id: "JavaScript", group: "language" },
                { id: "Java", group: "language" },
                { id: "Front-End", group: "core" },
                { id: "React", group: "framework" },
                { id: "Next.js", group: "framework" },
                { id: "Tailwind CSS", group: "framework" },
                { id: "D3.js", group: "library" },
                { id: "Three.js", group: "library" },
                { id: "Back-End", group: "core" },
                { id: "SQL", group: "database" },
                { id: "Ferramentas", group: "core" },
                { id: "Git", group: "tool" },
                { id: "Design", group: "core" },
                { id: "Figma", group: "tool" },
                { id: "UI/UX", group: "design" },
                { id: "Segurança", group: "core" },
                { id: "Cybersecurity", group: "security" },
            ],
            links: [
                { source: "Programação", target: "Python" }, { source: "Programação", target: "JavaScript" }, { source: "Programação", target: "Java" },
                { source: "Front-End", target: "JavaScript" }, { source: "Front-End", target: "React" }, { source: "Front-End", target: "Next.js" }, { source: "Front-End", target: "Tailwind CSS" },
                { source: "React", target: "JavaScript" }, { source: "Next.js", target: "React" }, { source: "D3.js", target: "JavaScript" }, { source: "Three.js", target: "JavaScript" },
                { source: "Back-End", target: "Python" }, { source: "Back-End", target: "Java" }, { source: "Back-End", target: "SQL" },
                { source: "Ferramentas", target: "Git" }, { source: "Ferramentas", target: "Figma" },
                { source: "Design", target: "Figma" }, { source: "Design", target: "UI/UX" }, { source: "Front-End", target: "UI/UX" },
                { source: "Segurança", target: "Cybersecurity" }, { source: "Programação", target: "Cybersecurity" }
            ]
        };

        const skillDescriptions = {
  "Python": `Comecei a estudar Python aos 14 anos enquanto mergulhava
  em cybersecurity. A linguagem acabou virando minha porta de entrada
  para automação e para os bots de Discord que já construí.`,
  "JavaScript": `Gosto de pensar no JavaScript como meu “canivete
  suíço”, do front-end à lógica de servidores, ele me permite
  transformar ideias em interfaces vivas.`,
  "Java": `É a linguagem que me deu disciplina de engenharia de
  software. Comecei a estudar na UniFil, dentro do curso de Ciência da
  Computação. Usei Java em projetos acadêmicos de POO e em APIs
  simples para a Federação de Automobilismo.`,
  "React": `React foi a base do LearnConnect. Curto o fluxo de dados
  previsível que ele traz para UIs complexas.`,
  "Next.js": `Server Side Rendering no LearnConnect veio com Next.js,
  garantindo SEO e páginas super rápidas.`,
  "Tailwind CSS": `Meu framework favorito para estilização. Posso
  prototipar interfaces em minutos sem sair do HTML.`,
  "D3.js": `Ferramenta essencial para criar as visualizações interativas
  de dados de corridas da FPrA, inclusive esta constelação.`,
  "Three.js": `Exploro 3D na web por hobby, foi com Three.js que criei
  o background de partículas deste portfólio.`,
  "SQL": `Nada como um bom SELECT para descobrir padrões nos resultados
  das pistas. Uso SQL todos os dias como data-analyst.`,
  "Git": `Tudo o que eu faço no mundo dev é feito com versionamento,
  sempre busco manter um bom padrão de comunicação e informação nos
  commits`,
  "Figma": `Faço do Figma meu caderno de rascunhos digitais antes de
  qualquer linha de código. Literalmente a minha paixão mais forte no
  mundo dev é a arte do design gráfico. Desde pequeno, sempre amei criar.`,
  "UI/UX": `Acredito que código bonito é inútil se a experiência
  desaponta. Por isso estudo fluxos, acessibilidade e micro-interações.`,
  "Cybersecurity": `CTFs, labs e muita curiosidade: segurança é meu
  combustível para aprender como as coisas realmente funcionam.`,
  "Programação":  "O centro de tudo que faço.",
  "Front-End":    "Onde criatividade vira interface.",
  "Back-End":     "A engrenagem por trás da mágica.",
  "Ferramentas":  "Utilitários que aceleram meu dia a dia.",
  "Design":       "Transformando ideias em valor visual.",
  "Segurança":    "Camada crítica para qualquer projeto."
};

        const skillIcons = {
  "Python":        "assets/images/python.png",
  "JavaScript":    "assets/images/javascript.png",
  "Java":          "assets/images/java.png",
  "React":         "assets/images/react.png",
  "Next.js":       "assets/images/nextjs.png",
  "Tailwind CSS":  "assets/images/tailwindcss.png",
  "D3.js":         "assets/images/d3.png",   
  "Three.js":      "assets/images/threejs.png",
  "SQL":           "assets/images/sql.png",
  "Git":           "assets/images/git.png",
  "Figma":         "assets/images/figma.png",
  "UI/UX":         "assets/images/uiux_design.png",
  "Cybersecurity": "assets/images/cybersecurity.png",
};

        const width = container.clientWidth;
        const height = container.clientHeight;
        const isMobile = window.innerWidth <= 768;
        const SCALE    = isMobile ? 0.65 : 1;

        const linkDist       = isMobile ? 70  : 100;
        const chargeStrength = isMobile ? -120 : -200; 

        const infoCard = document.createElement("div");
        infoCard.className = "skill-info-card";
        document.body.appendChild(infoCard);

        const svg = d3.select(container).append("svg")
            .attr("viewBox", [-width / 2, -height / 2, width, height]);

        const simulation = d3.forceSimulation(skillsData.nodes)
  .force("link",
         d3.forceLink(skillsData.links)
            .id(d => d.id)
            .distance(linkDist) 
  )
  .force("charge",
         d3.forceManyBody()
            .strength(chargeStrength)
  )
  .force("center", d3.forceCenter())
  .force("collide",
         d3.forceCollide()
            .radius(d => (d.group === "core" ? 26 : 20) * SCALE + 6)
            .iterations(2)
  );
       if (isMobile) simulation.alpha(0.6);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(["core", "language", "framework", "library", "database", "tool", "design", "security"]);

        const link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(skillsData.links)
            .enter().append("line")
            .attr("class", "skill-link");

        const node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(skillsData.nodes)
            .enter().append("g")
            .attr("class", "skill-node");

       node.each(function (d) {
  const g = d3.select(this);

  if (d.group === "core") {
    const starSize = 52 * SCALE;  
    g.classed("core-star", true)
     .append("image")
     .attr("href", "assets/images/star.png")
     .attr("width",  starSize)
     .attr("height", starSize)
     .attr("x", -starSize / 2)
     .attr("y", -starSize / 2);
  }

  else {
    const r        = 20 * SCALE; 
    const imgSize  = 32 * SCALE;

    g.append("circle")
     .attr("class", "glass")
     .attr("r", r);

    if (skillIcons[d.id]) {
      g.append("image")
       .attr("href",   skillIcons[d.id])
       .attr("width",  imgSize)
       .attr("height", imgSize)
       .attr("x", -imgSize / 2)
       .attr("y", -imgSize / 2);
    }
  }
});

        node.append("text")
       .text(d => d.id)
       .attr("y", d => (d.group === "core" ? 34 * SCALE : 28 * SCALE))
       .attr("font-size", isMobile ? 9 : 11);



        node.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

        // wrapper interno para aplicar transform via zoom
//const gZoom = svg.append("g");
//gZoom.append(() => link.node().parentNode.removeChild(link.node()));
//gZoom.append(() => node.node().parentNode.removeChild(node.node()));
//gZoom.append(() => link.node());
//gZoom.append(() => node.node());

// Zoom + pan (arrastar) + pinch
//svg.call(
  //d3.zoom()
    // .scaleExtent([.5, 3])
     //.on("zoom", e => gZoom.attr("transform", e.transform))
//);

        const linkedByIndex = {};
        skillsData.links.forEach(d => {
            linkedByIndex[`${d.source.id},${d.target.id}`] = 1;
        });

        function isConnected(a, b) {
            return linkedByIndex[`${a.id},${b.id}`] || linkedByIndex[`${b.id},${a.id}`] || a.id === b.id;
        }

        function showCard(d, evt){
  const desc = skillDescriptions[d.id] || "Em construção…";
  infoCard.innerHTML = `<h4>${d.id}</h4><p>${desc}</p>`;

  if (isMobile){
    infoCard.classList.add("mobile");
  }else{
    infoCard.classList.remove("mobile");
    moveCard(evt);  
  }

  requestAnimationFrame(()=>infoCard.classList.add("visible"));
}

function moveCard(evt){
  // margem mínima para não “vazar” da tela
  const pad = 12;
  let x = evt.clientX + 18;        // 18 px à direita do cursor
  let y = evt.clientY + 18;
  // corrige se bater na borda direita / baixo
  if (x + infoCard.offsetWidth  > window.innerWidth  - pad) x = evt.clientX - infoCard.offsetWidth - 18;
  if (y + infoCard.offsetHeight > window.innerHeight - pad) y = evt.clientY - infoCard.offsetHeight - 18;
  infoCard.style.left = x + "px";
  infoCard.style.top  = y + "px";
}

function hideCard(){
  infoCard.classList.remove("visible","mobile");
}

node
  .on("mouseenter", (evt,d)=> showCard(d,evt))
  .on("mousemove",  (evt)=>{ if (!isMobile) moveCard(evt); })
  .on("mouseleave", hideCard)
  // suporto toque: um tap mostra, segundo tap fora some
  .on("touchstart", (evt,d)=>{
     evt.preventDefault();
     showCard(d, evt.touches[0]);
     window.addEventListener("touchend", hideCard, { once:true });
  });



        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            const margin = 40 * SCALE; 
            node
                .each(d => {   
                  d.x = Math.max(-width/2  + margin, Math.min(width/2  - margin, d.x));
                  d.y = Math.max(-height/2 + margin, Math.min(height/2 - margin, d.y));
          })
                .attr("transform", d => `translate(${d.x},${d.y})`);

        });

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        window.addEventListener("resize", () => {
  const w      = container.clientWidth;
  const h      = container.clientHeight;
  svg.attr("viewBox", [-w/2, -h/2, w, h]);
  simulation.force("center").x(0).y(0);
  simulation.alpha(0.2).restart(); 
        });

      })();
    });
