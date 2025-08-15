
     // Fallback seguro p/ ícone do header (sem inline handler)
(()=>{
  const img = document.getElementById('kaliIcon');
  if (img) img.addEventListener('error', ()=>{
    img.src = '/assets/images/kali_fallback.png'; // use um PNG local
  }, { once:true });
})();

    // Garante noopener mesmo se esquecido em algum link
(()=>{
  const open = window.open;
  window.open = function(...args){
    const w = open.apply(window, args);
    try { if (w) w.opener = null; } catch {}
    return w;
  };
})();
    /* ========= Canvas de partículas (Three.js) ========= */
    (() => {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  // Scene
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  // Partículas
  const particlesCount = 300;
  const positions = new Float32Array(particlesCount * 3);
  for (let i = 0; i < particlesCount; i++) {
    positions[i*3+0] = (Math.random()-0.5)*10;
    positions[i*3+1] = (Math.random()-0.5)*10;
    positions[i*3+2] = (Math.random()-0.5)*10;
  }
  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particlesMaterial = new THREE.PointsMaterial({
    color: 0x99AAB5, size: 0.03, blending: THREE.AdditiveBlending, transparent: true, sizeAttenuation: true
  });
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  // Linhas (constelações)
  const linesGeometry = new THREE.BufferGeometry();
  const linesMaterial = new THREE.LineBasicMaterial({
    color: 0x7289DA, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending
  });
  const linePositions = new Float32Array(particlesCount * particlesCount * 3);
  linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
  scene.add(lines);

  camera.position.z = 5;

  // Mouse parallax + scroll
  const mouse = new THREE.Vector2();
  addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  });

  addEventListener('resize', () => {
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  });

  const clock = new THREE.Clock();

  function animate() {
    const t = clock.getElapsedTime();
    particles.rotation.y = t * 0.05;
    particles.rotation.x = t * 0.05;

    const scrollMax = document.documentElement.scrollHeight - innerHeight;
    const scrollPercent = scrollMax > 0 ? (scrollY / scrollMax) : 0;
    camera.position.z = 5 - scrollPercent * 4;
    camera.position.y = -scrollPercent * 2;

    camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.02;
    camera.position.y += (-mouse.y * 0.5 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    // Atualiza as linhas só para pontos próximos
    let idx = 0;
    const p = particles.geometry.attributes.position.array;
    const maxDistSq = 1 * 1; // 1 unidade^2
    for (let i = 0; i < particlesCount; i++) {
      const ix = p[i*3], iy = p[i*3+1], iz = p[i*3+2];
      for (let j = i + 1; j < particlesCount; j++) {
        const jx = p[j*3], jy = p[j*3+1], jz = p[j*3+2];
        const dx = ix - jx, dy = iy - jy, dz = iz - jz;
        const distSq = dx*dx + dy*dy + dz*dz;
        if (distSq < maxDistSq) {
          linePositions[idx++] = ix; linePositions[idx++] = iy; linePositions[idx++] = iz;
          linePositions[idx++] = jx; linePositions[idx++] = jy; linePositions[idx++] = jz;
        }
      }
    }
    lines.geometry.attributes.position.needsUpdate = true;
    lines.geometry.setDrawRange(0, idx / 3);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
})();

    /* ========= Header hide/show on scroll ========= */
    (() => {
  const nav = document.querySelector('header');
  let lastY = scrollY, hideTO = null;
  addEventListener('scroll', () => {
    const cur = scrollY;
    if (cur > lastY + 16) { clearTimeout(hideTO); hideTO = setTimeout(() => nav.classList.add('nav-hidden'), 250); lastY = cur; }
    else if (cur < lastY - 16) { nav.classList.remove('nav-hidden'); lastY = cur; }
  });
})();


    /* ========= Toolbox search ========= */
    (()=>{
      const search = document.getElementById('toolSearch'); const grid = document.getElementById('toolsGrid'); const cards=[...grid.children];
      const doFilter=(q)=>{ q=q.toLowerCase(); cards.forEach(c=>{ const text=(c.innerText+" "+(c.dataset.keywords||'')).toLowerCase(); c.style.display = text.includes(q)?'flex':'none'; }); };
      search.addEventListener('input', e=>doFilter(e.target.value));
    })();

    /* ========= Command Palette (Ctrl/Cmd+K) ========= */
    (()=>{
      const backdrop = document.getElementById('cmdk'); const input = document.getElementById('cmdkSearch'); const list = document.getElementById('cmdkList');
      const tools = [
        {id:'#exprInput', label:'Calculadora de Expressões'},
        {id:'#regexPattern', label:'Regex Tester'},
        {id:'#hashText', label:'Hash SHA‑256/512'},
        {id:'#jwtText', label:'JWT Decoder'},
        {id:'#b64Text', label:'Base64 UTF‑8'},
        {id:'#jsonText', label:'JSON Formatter'},
        {id:'#colorInput', label:'Conversor de Cores'},
        {id:'#dateA', label:'Diferença entre Datas'},
        {id:'#binInput', label:'Conversor Bin/Dec/Hex'},
        {id:'#textUtilIn', label:'Utilidades de Texto'},
        {id:'#urlIn', label:'URL Tools + UTM'},
        {id:'#pxIn', label:'px ⇄ rem'}
      ];
      function open(){ backdrop.style.display='flex'; input.value=''; render(''); setTimeout(()=>input.focus(),10); }
      function close(){ backdrop.style.display='none'; }
      document.getElementById('openCmdkBtn').addEventListener('click', open);
      addEventListener('keydown', (e)=>{ if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); backdrop.style.display==='flex'?close():open(); } if(e.key==='Escape') close(); });
      input.addEventListener('input', e=>render(e.target.value));
      function render(q){ q=q.toLowerCase(); list.innerHTML=''; tools.filter(t=>t.label.toLowerCase().includes(q)).forEach((t,i)=>{
        const item=document.createElement('div'); item.className='cmdk-item'; item.textContent=t.label; item.tabIndex=0; if(i===0) item.setAttribute('aria-selected','true');
        item.onclick=()=>{ close(); const el=document.querySelector(t.id); if(el){ el.scrollIntoView({behavior:'smooth', block:'center'}); el.focus({preventScroll:true}); } };
        list.appendChild(item);
      }); }
      backdrop.addEventListener('click', (e)=>{ if(e.target===backdrop) close(); });
    })();

    /* ========= Calculadora de Expressões ========= */
    (()=>{
      const expr = document.getElementById('exprInput'); const out = document.getElementById('exprOut');
      function safeEval(src){
  src = String(src || '').trim();
  if (!src) return 0;

  // === Tokenizer (sem eval) ===
  const tokens = [];
  let i = 0;
  const isWS   = c => /\s/.test(c);
  const isDig  = c => /[0-9]/.test(c);
  const isId0  = c => /[A-Za-z_]/.test(c);
  const isId   = c => /[A-Za-z0-9_]/.test(c);

  while (i < src.length) {
    const c = src[i];
    if (isWS(c)) { i++; continue; }

    // expoente "**" vira token '^'
    if (c === '*' && src[i+1] === '*') { tokens.push({type:'^'}); i += 2; continue; }

    if ("+-*/%^(),".includes(c)) { tokens.push({type:c}); i++; continue; }
    if (c === '(' || c === ')') { tokens.push({type:c}); i++; continue; }

    if (isDig(c) || c === '.') {
      let j = i;
      while (j < src.length && (isDig(src[j]) || src[j] === '.')) j++;
      // notação científica
      if (j < src.length && (src[j] === 'e' || src[j] === 'E')) {
        let k = j + 1;
        if (src[k] === '+' || src[k] === '-') k++;
        while (k < src.length && isDig(src[k])) k++;
        j = k;
      }
      const num = Number(src.slice(i, j));
      if (!Number.isFinite(num)) throw new Error('Número inválido');
      tokens.push({type:'num', value:num});
      i = j; continue;
    }

    if (isId0(c)) {
      let j = i + 1;
      while (j < src.length && isId(src[j])) j++;
      tokens.push({type:'id', value:src.slice(i, j)});
      i = j; continue;
    }

    throw new Error('Caractere inválido na posição ' + i);
  }

  // Permitidos
  const allowFns = new Set(['sin','cos','tan','abs','sqrt','log','pow','min','max','floor','ceil','round','exp','random']);
  const allowConst = { PI: Math.PI, E: Math.E };

  let pos = 0;
  const peek = () => tokens[pos];
  const take = (t) => {
    const k = tokens[pos];
    if (!k || (t && k.type !== t)) throw new Error('Esperado "' + t + '"');
    pos++; return k;
  };

  // === Parser (descida recursiva) ===
  function parseExpression(){ return parseAddSub(); }

  function parseAddSub(){
    let v = parseMulDiv();
    while (true) {
      const tk = peek();
      if (!tk || (tk.type !== '+' && tk.type !== '-')) break;
      take();
      const r = parseMulDiv();
      v = tk.type === '+' ? v + r : v - r;
    }
    return v;
  }

  function parseMulDiv(){
    let v = parsePower();
    while (true) {
      const tk = peek();
      if (!tk || (tk.type !== '*' && tk.type !== '/' && tk.type !== '%')) break;
      take();
      const r = parsePower();
      if (tk.type === '*') v *= r;
      else if (tk.type === '/') v /= r;
      else v %= r;
    }
    return v;
  }

  // ^ é associativo à direita
  function parsePower(){
    let v = parseUnary();
    const tk = peek();
    if (tk && tk.type === '^') { take('^'); v = Math.pow(v, parsePower()); }
    return v;
  }

  function parseUnary(){
    const tk = peek();
    if (tk && (tk.type === '+' || tk.type === '-')) {
      take();
      const r = parseUnary();
      return tk.type === '-' ? -r : r;
    }
    return parsePrimary();
  }

  function parsePrimary(){
    const tk = peek();
    if (!tk) throw new Error('Expressão incompleta');

    if (tk.type === 'num') { take(); return tk.value; }

    if (tk.type === '(') {
      take('(');
      const v = parseExpression();
      take(')');
      return v;
    }

    if (tk.type === 'id') {
      const name = tk.value; take();
      if (name in allowConst) return allowConst[name];

      if (!allowFns.has(name)) throw new Error('Função/constante não permitida: ' + name);

      take('(');
      const args = [];
      if (peek() && peek().type !== ')') {
        args.push(parseExpression());
        while (peek() && peek().type === ',') { take(','); args.push(parseExpression()); }
      }
      take(')');
      const f = Math[name];
      return f.apply(Math, args);
    }

    throw new Error('Token inesperado');
  }

  const result = parseExpression();
  if (pos !== tokens.length) throw new Error('Conteúdo extra após o fim da expressão');
  return result;
}

      document.getElementById('evalBtn').addEventListener('click',()=>{ try{ const v=safeEval(expr.value||''); out.textContent=String(v); }catch(e){ out.textContent='Erro: '+e.message; }});
      document.getElementById('clearExprBtn').addEventListener('click',()=>{ expr.value=''; out.textContent='—'; });
    })();

    /* ========= px ⇄ rem ========= */
    (()=>{
      const base = document.getElementById('remBase'); const px = document.getElementById('pxIn'); const rem = document.getElementById('remIn'); const out=document.getElementById('remOut');
      function px2rem(){ const b=+base.value||16; const v=parseFloat(px.value); if(isNaN(v)) return out.textContent='—'; out.textContent=(v/b)+'rem'; }
      function rem2px(){ const b=+base.value||16; const v=parseFloat(rem.value); if(isNaN(v)) return out.textContent='—'; out.textContent=(v*b)+'px'; }
      document.getElementById('pxToRem').addEventListener('click', px2rem);
      document.getElementById('remToPx').addEventListener('click', rem2px);
    })();

    /* ========= Regex Tester ========= */
    (()=>{
      const pat=document.getElementById('regexPattern'); const flg=document.getElementById('regexFlags'); const txt=document.getElementById('regexText'); const res=document.getElementById('regexResult');
      const run = () => {
  try {
    const r = new RegExp(pat.value, flg.value);
    const input = txt.value || '';
    const matches = [...input.matchAll(r)];
    if (!matches.length) { res.textContent = 'Sem correspondências.'; return; }

    const frag = document.createDocumentFragment();
    let last = 0;
    for (const m of matches) {
      const idx = m.index;
      frag.appendChild(document.createTextNode(input.slice(last, idx)));
      const mark = document.createElement('mark');
      mark.textContent = m[0];          // <<< sem HTML
      frag.appendChild(mark);
      last = idx + m[0].length;
    }
    frag.appendChild(document.createTextNode(input.slice(last)));
    res.replaceChildren(frag);           // <<< sem innerHTML
  } catch(e) {
    res.textContent = 'Erro: ' + e.message;
  }
};
      document.getElementById('regexRun').addEventListener('click', run);
      document.getElementById('regexClear').addEventListener('click', ()=>{ pat.value=''; flg.value=''; txt.value=''; res.textContent='—'; });
    })();

    /* ========= Hash SHA ========= */
    async function sha(hexAlg, msg){
      const enc = new TextEncoder(); const data=enc.encode(msg||''); const dig = await crypto.subtle.digest(hexAlg, data);
      return [...new Uint8Array(dig)].map(b=>b.toString(16).padStart(2,'0')).join('');
    }
    (()=>{
      const input=document.getElementById('hashText'); const out=document.getElementById('hashOut');
      document.getElementById('doSHA256').addEventListener('click', async()=>{ out.textContent='Calculando…'; out.textContent=await sha('SHA-256', input.value); });
      document.getElementById('doSHA512').addEventListener('click', async()=>{ out.textContent='Calculando…'; out.textContent=await sha('SHA-512', input.value); });
    })();

    /* ========= JWT Decoder ========= */
    (()=>{
      const input=document.getElementById('jwtText'); const out=document.getElementById('jwtOut');
      function b64urlToStr(s){ s=s.replace(/-/g,'+').replace(/_/g,'/'); const pad = s.length%4? '='.repeat(4-(s.length%4)) : ''; s+=pad; try{ return decodeURIComponent(Array.prototype.map.call(atob(s),c=>'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')); }catch{ return atob(s); } }
      document.getElementById('decodeJWT').addEventListener('click',()=>{
        try{ const parts=(input.value||'').split('.'); if(parts.length<2) throw new Error('Token inválido');
          const header=JSON.parse(b64urlToStr(parts[0])); const payload=JSON.parse(b64urlToStr(parts[1])); out.textContent=JSON.stringify({header,payload}, null, 2);
        }catch(e){ out.textContent='Erro: '+e.message; }
      });
    })();

    /* ========= Base64 UTF‑8 ========= */
    (()=>{
      const input=document.getElementById('b64Text'); const out=document.getElementById('b64Out');
      function toB64(s){ return btoa(unescape(encodeURIComponent(s))); }
      function fromB64(b){ return decodeURIComponent(escape(atob(b))); }
      document.getElementById('toB64').addEventListener('click',()=>{ try{ out.textContent=toB64(input.value||''); }catch(e){ out.textContent='Erro: '+e.message; } });
      document.getElementById('fromB64').addEventListener('click',()=>{ try{ out.textContent=fromB64(input.value||''); }catch(e){ out.textContent='Erro: '+e.message; } });
    })();

    /* ========= JSON Formatter ========= */
    (()=>{
      const input=document.getElementById('jsonText'); const out=document.getElementById('jsonOut');
      document.getElementById('jsonPretty').addEventListener('click',()=>{ try{ out.textContent=JSON.stringify(JSON.parse(input.value||'{}'), null, 2); }catch(e){ out.textContent='Erro: '+e.message; } });
      document.getElementById('jsonMinify').addEventListener('click',()=>{ try{ out.textContent=JSON.stringify(JSON.parse(input.value||'{}')); }catch(e){ out.textContent='Erro: '+e.message; } });
    })();

    /* ========= Color Converter ========= */
    (()=>{
      const picker=document.getElementById('colorPicker'); const input=document.getElementById('colorInput'); const out=document.getElementById('colorOut');
      function hexToRgb(hex){ hex=hex.replace('#',''); if(hex.length===3) hex=[...hex].map(x=>x+x).join(''); const num=parseInt(hex,16); return {r:(num>>16)&255, g:(num>>8)&255, b:num&255}; }
      function rgbToHsl(r,g,b){ r/=255; g/=255; b/=255; const max=Math.max(r,g,b), min=Math.min(r,g,b); let h,s,l=(max+min)/2; if(max===min){ h=s=0; } else { const d=max-min; s=l>0.5? d/(2-max-min) : d/(max+min); switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;} h/=6; } return {h:Math.round(h*360), s:Math.round(s*100), l:Math.round(l*100)}; }
      function convert(val){ let rgb; if(/^#?[0-9a-fA-F]{3,6}$/.test(val)){ rgb=hexToRgb(val); } else if(/^\s*rgb\s*\(/.test(val)){ const m=val.match(/rgb\s*\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)/); if(!m) throw new Error('RGB inválido'); rgb={r:+m[1],g:+m[2],b:+m[3]}; } else { throw new Error('Use HEX (#aabbcc) ou rgb(r,g,b)'); }
        const hsl=rgbToHsl(rgb.r,rgb.g,rgb.b); const hex = '#'+[rgb.r,rgb.g,rgb.b].map(v=>v.toString(16).padStart(2,'0')).join(''); out.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b}) • hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%) • ${hex}`; picker.value=hex; input.value=hex; }
      picker.addEventListener('input', e=>convert(e.target.value));
      document.getElementById('colorConvert').addEventListener('click',()=>{ try{ convert(input.value.trim()); }catch(e){ out.textContent='Erro: '+e.message; } })
      convert('#5c64f4');
    })();

    /* ========= Datas ========= */
    (()=>{
      const a=document.getElementById('dateA'); const b=document.getElementById('dateB'); const out=document.getElementById('dateOut');
      const pad=n=>String(n).padStart(2,'0');
      function diff(){ try{
        const t1= a.value? new Date(a.value).getTime() : NaN; const t2= b.value? new Date(b.value).getTime() : NaN; if(isNaN(t1)||isNaN(t2)) throw new Error('Defina as duas datas.');
        let ms=Math.abs(t2-t1); const sign = (t2>=t1)?'+':'-';
        const days=Math.floor(ms/86400000); ms%=86400000; const h=Math.floor(ms/3600000); ms%=3600000; const m=Math.floor(ms/60000); ms%=60000; const s=Math.floor(ms/1000);
        out.textContent = `${sign} ${days}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
      }catch(e){ out.textContent='Erro: '+e.message; } }
      document.getElementById('dateDiffBtn').addEventListener('click', diff);
      document.getElementById('dateNowA').addEventListener('click', ()=>{ a.value=new Date().toISOString().slice(0,16); });
      document.getElementById('dateNowB').addEventListener('click', ()=>{ b.value=new Date().toISOString().slice(0,16); });
    })();

    /* ========= Bases ========= */
    (()=>{
      const bin=document.getElementById('binInput'); const dec=document.getElementById('decInput'); const hex=document.getElementById('hexInput');
      const syncFrom=(src)=>{
        try{
          if(src==='bin'){ const v=parseInt(bin.value.replace(/[^01]/g,''),2); if(isNaN(v)) throw 0; dec.value=String(v); hex.value=v.toString(16).toUpperCase(); }
          if(src==='dec'){ const v=parseInt(dec.value.replace(/[^0-9]/g,''),10); if(isNaN(v)) throw 0; bin.value=v.toString(2); hex.value=v.toString(16).toUpperCase(); }
          if(src==='hex'){ const v=parseInt(hex.value.replace(/[^0-9a-fA-F]/g,''),16); if(isNaN(v)) throw 0; dec.value=String(v); bin.value=v.toString(2); }
        }catch{ /* ignore */ }
      };
      bin.addEventListener('input', ()=>syncFrom('bin'));
      dec.addEventListener('input', ()=>syncFrom('dec'));
      hex.addEventListener('input', ()=>syncFrom('hex'));
    })();

    /* ========= Texto Utils ========= */
    (()=>{
      const input=document.getElementById('textUtilIn'); const out=document.getElementById('textUtilOut');
      const map = {
        slug: s=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-'),
        camel: s=>{ const w=s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().match(/[a-z0-9]+/g)||[]; return w.map((x,i)=> i? x[0].toUpperCase()+x.slice(1) : x).join(''); },
        snake: s=> (s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().match(/[a-z0-9]+/g)||[]).join('_'),
        kebab: s=> (s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().match(/[a-z0-9]+/g)||[]).join('-'),
        upper: s=> s.toUpperCase(),
        lower: s=> s.toLowerCase(),
        noaccent: s=> s.normalize('NFD').replace(/\p{Diacritic}/gu,'')
      };
      document.querySelectorAll('[data-text-action]').forEach(btn=>{
        btn.addEventListener('click',()=>{ const k=btn.dataset.textAction; const fn=map[k]; out.textContent = fn? fn(input.value||'') : '—'; });
      });
    })();

    /* ========= UUID ========= */
    (()=>{
      const out=document.getElementById('uuidOut');
      const gen=()=>{ const b=new Uint8Array(16); crypto.getRandomValues(b); b[6]=(b[6]&0x0f)|0x40; b[8]=(b[8]&0x3f)|0x80; const h=[...b].map((x,i)=> (i===4||i===6||i===8||i===10?'-':'')+x.toString(16).padStart(2,'0')).join(''); return h; };
      document.getElementById('uuidOne').addEventListener('click',()=>{ out.textContent=gen(); });
      document.getElementById('uuidMany').addEventListener('click',()=>{ out.textContent = Array.from({length:10}, gen).join('\n'); });
    })();

    /* ========= URL Tools ========= */
    (()=>{
      const urlIn=document.getElementById('urlIn'); const out=document.getElementById('urlOut');
      document.getElementById('urlEncode').addEventListener('click',()=>{ try{ out.textContent=encodeURI(urlIn.value||''); }catch(e){ out.textContent='Erro: '+e.message; } });
      document.getElementById('urlDecode').addEventListener('click',()=>{ try{ out.textContent=decodeURI(urlIn.value||''); }catch(e){ out.textContent='Erro: '+e.message; } });
      document.getElementById('buildUTM').addEventListener('click',()=>{ try{
        const u=new URL(urlIn.value||'https://exemplo.com/');
        const s=document.getElementById('utmSource').value.trim();
        const m=document.getElementById('utmMedium').value.trim();
        const c=document.getElementById('utmCampaign').value.trim();
        if(s) u.searchParams.set('utm_source', s); if(m) u.searchParams.set('utm_medium', m); if(c) u.searchParams.set('utm_campaign', c);
        out.textContent=u.toString();
      }catch(e){ out.textContent='Erro: URL inválida'; } });
    })();

    /* ========= Timeline Data ========= */
 const timelineData = [
  {
    tech:'Python',
    year:2018,
    month:6,
    title:'Início com Python + Cybersec',
    note:'Primeiros scripts e automações; porta de entrada para bots e CTFs.',
    modal:{
      subtitle:'Primeiros passos sérios em programação',
      details:`<p>Comecei por automações de tarefas, parsing de HTML e pequenos CLIs.
      A curiosidade em segurança me levou a entender HTTP, sessões e
      boas práticas de sanitização — bases que sigo usando até hoje.</p>`,
      highlights:[
        'Automação de tarefas do dia a dia',
        'Requests, parsing e manipulação de arquivos',
        'Fundamentos de segurança (hash, encoding, JWT)'
      ],
      stack:['Python','Requests','BeautifulSoup','argparse','Linux'],
      metrics:[
        {label:'Scripts iniciais', value:'20+'},
        {label:'Bots protótipo', value:'2'}
      ],
      links:[
        {label:'Snippets no GitHub', href:'https://github.com/cai0duque'},
        {label:'Gists', href:'https://gist.github.com/cai0duque'}
      ],
      code:{ lang:'bash', snippet:
`# Ambiente rápido
python3 -m venv .venv
source .venv/bin/activate
pip install requests beautifulsoup4

# Ex.: baixar e extrair títulos <h1>
python - <<'PY'
import requests, bs4
html = requests.get("https://example.com").text
soup = bs4.BeautifulSoup(html, "html.parser")
print([h.get_text(strip=True) for h in soup.select("h1")])
PY` },
      media:['/assets/images/python.png','/assets/images/galaxy_badge.png']
    }
  },

  {
    tech:'Cybersecurity',
    year:2018,
    month:8,
    title:'Labs & CTFs',
    note:'Estudo contínuo, curiosidade e práticas seguras.',
    modal:{
      subtitle:'Mentalidade defensiva e ética desde o início',
      details:`<p>Participei de laboratórios seguros (CTFs/labs locais) para
      entender <em>vulnerabilidades comuns</em>, sempre com foco educacional.
      Esse caminho moldou minha atenção a logs, autenticação e validação.</p>`,
      highlights:[
        'CTFs introdutórios (web e forense)',
        'Princípios OWASP e modelagem de ameaça',
        'Boas práticas: hashing, encoding, rate limits'
      ],
      stack:['Kali Linux','OWASP Top 10','Hashing (SHA-256)','JWT'],
      metrics:[
        {label:'Labs concluídos', value:'15+'},
        {label:'Checklists pessoais', value:'3'}
      ],
      links:[
        {label:'Perfil LinkedIn', href:'https://linkedin.com/in/cai0duque'}
      ],
      code:{ lang:'bash', snippet:
`# Hash rápido de arquivo (verificação de integridade)
python - <<'PY'
import hashlib, sys
p = sys.argv[1] if len(sys.argv)>1 else __file__
print("sha256:", hashlib.sha256(open(p,"rb").read()).hexdigest())
PY  caminho/do/arquivo` },
      media:['/assets/images/cybersecurity.png']
    }
  },

  {
    tech:'JavaScript',
    year:2019,
    month:9,
    title:'JS para Web',
    note:'Primeiros projetos front e interações dinâmicas.',
    modal:{
      subtitle:'DOM, eventos e consumo de APIs',
      details:`<p>Comecei no ecossistema web puro: manipulação do DOM, listeners,
      <code>fetch</code> e componentes básicos. Essa base facilitou React/Next mais tarde.</p>`,
      highlights:[
        'Manipulação de DOM e eventos',
        'Fetch + JSON + tratativa de erros',
        'Componentização manual (sem libs)'
      ],
      stack:['JavaScript','DOM','Fetch API','CSS'],
      metrics:[
        {label:'Mini-projetos', value:'10+'},
        {label:'Boilerplates próprios', value:'3'}
      ],
      links:[
        {label:'GitHub', href:'https://github.com/cai0duque'}
      ],
      code:{ lang:'js', snippet:
`// Ex.: busca simples com tratamento de erro
async function loadUsers(){
  try{
    const r = await fetch('https://jsonplaceholder.typicode.com/users');
    if(!r.ok) throw new Error('Falha na API');
    const data = await r.json();
    console.log(data.map(u => u.name));
  }catch(e){
    console.error('Erro:', e.message);
  }
}
loadUsers();` },
      media:['/assets/images/javascript.png']
    }
  },

  {
    tech:'React',
    year:2023,
    month:4,
    title:'Migração para React',
    note:'Componentização e estados para UIs mais complexas.',
    modal:{
      subtitle:'Do vanilla para o ecossistema de componentes',
      details:`<p>Organizei UI em componentes reutilizáveis, estados previsíveis e
      comunicação entre partes. Adoção de hooks e boas práticas de acessibilidade.</p>`,
      highlights:[
        'Hooks (useState, useEffect)',
        'Composição de componentes',
        'Acessibilidade e responsividade'
      ],
      stack:['React','Hooks','Vite','A11y'],
      metrics:[
        {label:'Componentes criados', value:'40+'},
        {label:'Reuso em projetos', value:'Alto'}
      ],
      links:[
        {label:'Perfil GitHub', href:'https://github.com/cai0duque'}
      ],
      code:{ lang:'jsx', snippet:
`function Counter(){
  const [count, setCount] = React.useState(0);
  return (
    <button onClick={()=>setCount(c=>c+1)} className="btn">
      Contador: {count}
    </button>
  );
}` },
      media:['/assets/images/react.png']
    }
  },

  {
    tech:'Next.js',
    year:2024,
    month:10,
    title:'SSR & Rotas App Dir',
    note:'Base para projetos com SEO e APIs no mesmo stack.',
    modal:{
      subtitle:'Server-side rendering e rotas modernas',
      details:`<p>Estruturei projetos com diretório <code>app/</code>, rotas server,
      SEO melhorado e endpoints colocados lado a lado com a UI.</p>`,
      highlights:[
        'SSR e streaming',
        'Rotas server (app dir)',
        'SEO + metadados'
      ],
      stack:['Next.js','React','TypeScript','Edge/Node'],
      metrics:[
        {label:'Tempo inicial (TTFB)', value:'↓'},
        {label:'Páginas SSR', value:'Diversas'}
      ],
      links:[
        {label:'Docs Next.js', href:'https://nextjs.org/docs'}
      ],
      code:{ lang:'ts', snippet:
`// app/api/ping/route.ts
export async function GET(){
  return new Response(JSON.stringify({ok:true, ts:Date.now()}), {
    headers: {'content-type':'application/json'}
  });
}` },
      media:['/assets/images/nextjs.png']
    }
  },

  {
    tech:'Tailwind CSS',
    year:2024,
    month:11,
    title:'Design veloz',
    note:'Produtividade alta com utilitários e consistência visual.',
    modal:{
      subtitle:'Sistema de design pragmático',
      details:`<p>Padronizei espaçamentos, tipografia e cores com utilitários.
      Resultado: iteração mais rápida e componentes consistentes.</p>`,
      highlights:[
        'Escalas de spacing e fontes',
        'Dark mode e estados (hover/focus)',
        'Componentes responsivos'
      ],
      stack:['Tailwind CSS','PostCSS','Design Tokens'],
      metrics:[
        {label:'Tempo de protótipo', value:'↓ ~40%'},
        {label:'Consistência visual', value:'↑'}
      ],
      links:[
        {label:'Tailwind Docs', href:'https://tailwindcss.com/docs'}
      ],
      code:{ lang:'jsx', snippet:
`export function Card({title, children}){
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow">
      <h3 className="text-indigo-300 font-semibold mb-2">{title}</h3>
      <div className="text-slate-200/90 leading-relaxed">{children}</div>
    </div>
  );
}` },
      media:['/assets/images/tailwindcss.png']
    }
  },

  {
    tech:'SQL',
    year:2025,
    month:1,
    title:'Data Analyst FPrA',
    note:'Consultas diárias e análise de dados de corridas.',
    modal:{
      subtitle:'Relatórios e insights para automobilismo',
      details:`<p>Modelei consultas por etapa/piloto/equipe, com CTEs e janelas
      para rankings e históricos. Visualizações rápidas ajudaram decisões durante eventos.</p>`,
      highlights:[
        'CTEs e funções janela',
        'Normalização de dados',
        'KPIs por etapa e piloto'
      ],
      stack:['SQL','PostgreSQL','d3.js'],
      metrics:[
        {label:'Consultas/dia', value:'50+'},
        {label:'Média por consulta', value:'< 120 ms'}
      ],
      links:[
        {label:'LinkedIn', href:'https://linkedin.com/in/cai0duque'}
      ],
      code:{ lang:'sql', snippet:
`WITH pontos AS (
  SELECT piloto, etapa, SUM(pontos) AS total
  FROM resultados
  GROUP BY piloto, etapa
)
SELECT piloto, SUM(total) AS campeonato
FROM pontos
GROUP BY piloto
ORDER BY campeonato DESC;` },
      media:['/assets/images/sql.png','/assets/images/banner.png']
    }
  },

  {
    tech:'Next.js',
    year:2025,
    month:2,
    title:'LearnConnect',
    note:'Frontend em Next.js; integrações com API e UX interativa.',
    modal:{
      subtitle:'Plataforma de aprendizado colaborativo',
      details:`<p>Stack moderna com foco em SSR, UX responsiva e integrações
      (APIs, auth e conteúdo dinâmico). Evolui junto com a comunidade.</p>`,
      highlights:[
        'SSR + SEO sólido',
        'Design responsivo com Tailwind',
        'Integração com API e cache'
      ],
      stack:['Next.js','React','Tailwind CSS'],
      metrics:[
        {label:'Páginas', value:'24'},
        {label:'Core Web Vitals', value:'> 90'}
      ],
      links:[
        {label:'Demo (HTTP)', href:'http://168.75.74.153:3001/'},
        {label:'GitHub', href:'https://github.com/cai0duque'}
      ],
      code:{ lang:'bash', snippet:
`# scaffold
npx create-next-app@latest

# tailwind
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# rodar
npm run dev` },
      media:['/assets/images/learnconnect_logo.png','/assets/images/banner.png']
    }
  },

  {
    tech:'React',
    year:2025,
    month:3,
    title:'Comentários & Likes',
    note:'Integração real-time/REST no LearnConnect.',
    modal:{
      subtitle:'Interações sociais e feedback do usuário',
      details:`<p>Implementei comentários/likes com atualização rápida, cache
      otimista e fallback para REST. Foco em UX perceptível.</p>`,
      highlights:[
        'Mutations otimizadas',
        'Feedback visual imediato',
        'Tratamento de erros amigável'
      ],
      stack:['React','Next.js','Fetch/WS'],
      metrics:[
        {label:'Latência percebida', value:'~0-100 ms'},
        {label:'Taxa de erro', value:'↓ com retry'}
      ],
      links:[
        {label:'Repositório base', href:'https://github.com/cai0duque'}
      ],
      code:{ lang:'jsx', snippet:
`function LikeButton({postId}){
  const [count,setCount] = React.useState(0);
  async function like(){
    setCount(c=>c+1); // otimista
    try{
      const r = await fetch('/api/like?id='+postId,{method:'POST'});
      if(!r.ok) throw 0;
    }catch{ setCount(c=>Math.max(0,c-1)); }
  }
  return <button onClick={like} className="btn">❤ {count}</button>;
}` },
      media:['/assets/images/react.png']
    }
  },

  {
    tech:'Tailwind CSS',
    year:2025,
    month:3,
    title:'Nova Home animada',
    note:'Interações, neon e scroll suave.',
    modal:{
      subtitle:'Micro-interações com foco em leitura',
      details:`<p>Polimento visual com glass, <em>shadows</em> sutis,
      transições e responsividade. O resultado é uma home viva, porém leve.</p>`,
      highlights:[
        'Glassmorphism controlado',
        'Transições suaves',
        'Layout responsivo em grid'
      ],
      stack:['Tailwind CSS','CSS Transitions','A11y'],
      metrics:[
        {label:'Tempo de construção', value:'↓'},
        {label:'Consistência de UI', value:'↑'}
      ],
      links:[
        {label:'Portfólio', href:'https://caioduque.dev/'}
      ],
      code:{ lang:'jsx', snippet:
`export function NeonTitle({children}){
  return (
    <h2 className="text-4xl font-extrabold text-indigo-300
      [text-shadow:0_0_6px_#5c64f4,0_0_12px_#5c64f4]">
      {children}
    </h2>
  );
}` },
      media:['/assets/images/tailwindcss.png','/assets/images/nebula.png']
    }
  }
];

    timelineData.forEach(d=>{
  d.id = (d.tech+'-'+d.year+'-'+(d.month||1)+'-'+(d.title||''))
    .toLowerCase().replace(/[^a-z0-9]+/g,'-');
});


      const techIcon = {
    'Python':        '/assets/images/python.png',
    'JavaScript':    '/assets/images/javascript.png',
    'React':         '/assets/images/react.png',
    'Next.js':       '/assets/images/nextjs.png',
    'Tailwind CSS':  '/assets/images/tailwindcss.png',
    'SQL':           '/assets/images/sql.png',
    'Cybersecurity': '/assets/images/cybersecurity.png'
  };
    const TL_FALLBACK_ICON = '/assets/images/galaxy_badge.png';

    /* ===== Modal helpers ===== */
function openTimelineModal(d){
  const b = document.getElementById('tlModalBackdrop');
  const icon = document.getElementById('tlModalIcon');
  const tech = d.tech;

  document.getElementById('tlModalTech').textContent  = tech;
  document.getElementById('tlModalTitle').textContent = d.title || tech;

  const m = d.month ? String(d.month).padStart(2,'0')+'/' : '';
  const dateStr = `${m}${d.year}`;

  // Ícone
  icon.src = (techIcon && techIcon[tech]) ? techIcon[tech] : TL_FALLBACK_ICON;
  icon.alt = tech;

  // Helpers
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const aesc = s => esc(s).replace(/"/g,'&quot;');
  function safeHref(href){
  try{
    const u = new URL(href, location.origin);
    const ok = ['http:', 'https:', 'mailto:'].includes(u.protocol);
    return ok ? u.toString() : '#';
  }catch{
    return '#';
  }
}
// Permite apenas um subconjunto de tags/atributos seguros
function sanitizeHTML(html){
  const t = document.createElement('template');
  t.innerHTML = String(html || '');

  const ALLOWED_TAGS = new Set(['p','ul','ol','li','em','strong','code','pre','br','a']);
  const ALLOWED_ATTRS = { a: new Set(['href','target','rel']) };

  [...t.content.querySelectorAll('*')].forEach(el=>{
    const tag = el.tagName.toLowerCase();

    // Remove tags não permitidas
    if (!ALLOWED_TAGS.has(tag)) {
      el.replaceWith(document.createTextNode(el.textContent || ''));
      return;
    }

    // Remove atributos perigosos e normaliza href
    [...el.attributes].forEach(attr=>{
      const n = attr.name.toLowerCase();
      const v = attr.value;
      // remove eventos e style inline
      if (n.startsWith('on') || n === 'style') { el.removeAttribute(attr.name); return; }
      // ancora: limpa href com nossa whitelist
      if (tag === 'a' && n === 'href') { el.setAttribute('href', safeHref(v)); return; }
      // só mantém whitelisted
      if (!(ALLOWED_ATTRS[tag] && ALLOWED_ATTRS[tag].has(n))) el.removeAttribute(attr.name);
    });

    // reforço nos links
    if (tag === 'a') {
      el.setAttribute('target','_blank');
      el.setAttribute('rel','noopener');
    }
  });

  return t.innerHTML;
}
  function safeImgSrc(src){
  try{
    const u = new URL(src, location.origin);
    // Somente mesma origem (ou uma whitelist sua)
    const sameHost = u.origin === location.origin;
    const ok = ['http:','https:'].includes(u.protocol) && sameHost;
    return ok ? u.toString() : '/assets/images/galaxy_badge.png';
  }catch{
    return '/assets/images/galaxy_badge.png';
  }
}

  // Montagem do conteúdo
  const modal = d.modal || {};
  const parts = [];

  // Meta (data + subtitle)
  parts.push(`<p class="meta">${dateStr}${modal.subtitle ? ' • ' + esc(modal.subtitle) : ''}</p>`);

  // Nota curta (compat com seu schema antigo)
  if (d.note) parts.push(`<p class="mt-2">${esc(d.note)}</p>`);

  // Details (HTML controlado)
  if (modal.details) parts.push(`<div class="section selectable"><h6>Resumo</h6>${sanitizeHTML(modal.details)}</div>`);

  // Highlights
  if (Array.isArray(modal.highlights) && modal.highlights.length){
    parts.push(`<div class="section"><h6>Highlights</h6><ul class="list-disc ml-5">${modal.highlights.map(h=>`<li>${esc(h)}</li>`).join('')}</ul></div>`);
  }

  // Stack
  if (Array.isArray(modal.stack) && modal.stack.length){
    parts.push(`<div class="section"><h6>Stack</h6><div class="tags">${modal.stack.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div>`);
  }

  // Métricas
  if (Array.isArray(modal.metrics) && modal.metrics.length){
    parts.push(`<div class="section"><h6>Métricas</h6><div class="metrics">${
      modal.metrics.map(m=>`<div class="metric"><div class="lbl">${esc(m.label)}</div><div class="val">${esc(m.value)}</div></div>`).join('')
    }</div></div>`);
  }

  // Links/CTAs
  if (Array.isArray(modal.links) && modal.links.length){
    parts.push(`<div class="section"><h6>Links</h6><div class="links">${
      modal.links.map(l=>`<a class="btn" target="_blank" rel="noopener noreferrer" href="${aesc(safeHref(l.href))}">${esc(l.label)}</a>`).join('')
    }</div></div>`);
  }

  // Código (com copiar)
  if (modal.code && modal.code.snippet){
    parts.push(`<div class="section codebox">
      <h6>Snippet (${esc(modal.code.lang || '')})</h6>
      <button class="btn copy" id="tlCopyCode">Copiar</button>
      <pre class="selectable"><code>${esc(modal.code.snippet)}</code></pre>
    </div>`);
  }

  // Carrossel de mídia
  if (Array.isArray(modal.media) && modal.media.length){
    const imgs = modal.media.map((src,i)=>`<img src="${aesc(safeImgSrc(src))}" alt="${esc(tech)} ${i+1}" class="${i===0?'active':''}">`).join('');
    parts.push(`<div class="section carousel">
      <h6>Mídia</h6>
      <div class="viewport">${imgs}</div>
      ${modal.media.length>1 ? `
        <button class="nav prev btn" type="button" aria-label="Anterior">‹</button>
        <button class="nav next btn" type="button" aria-label="Próximo">›</button>
      `:''}
    </div>`);
  }

  // Injeta
  const content = document.querySelector('#tlModal .content');
  content.innerHTML = parts.join('');

  // Ações pós-render: copiar, carrossel
  const copyBtn = document.getElementById('tlCopyCode');
  if (copyBtn){
    copyBtn.addEventListener('click', async ()=>{
      const code = content.querySelector('.codebox pre').innerText;
      try{ await navigator.clipboard.writeText(code); copyBtn.textContent='Copiado!'; setTimeout(()=>copyBtn.textContent='Copiar',1300); }
      catch{ copyBtn.textContent='Falhou :('; setTimeout(()=>copyBtn.textContent='Copiar',1300); }
    });
  }

  const viewport = content.querySelector('.carousel .viewport');
  if (viewport){
    const imgs = [...viewport.querySelectorAll('img')];
    let idx = imgs.findIndex(i=>i.classList.contains('active')); if(idx<0) idx=0;
    const show = (i)=>{ imgs.forEach(im=>im.classList.remove('active')); imgs[i].classList.add('active'); };
    const prev = content.querySelector('.carousel .prev');
    const next = content.querySelector('.carousel .next');
    prev && prev.addEventListener('click', ()=>{ idx = (idx-1+imgs.length)%imgs.length; show(idx); });
    next && next.addEventListener('click', ()=>{ idx = (idx+1)%imgs.length; show(idx); });
  }

  // Abre modal
  b.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(()=>document.getElementById('tlModalClose').focus(), 10);
}
    function closeTimelineModal(){
  document.getElementById('tlModalBackdrop').style.display='none';
  document.body.style.overflow = '';            // <<< libera novamente
        // <<< remove #t=... da URL para não reabrir no refresh
  if (location.hash.startsWith('#t=')) {
    history.replaceState(null, '', location.pathname + location.search);
  }
}

document.getElementById('tlModalClose').addEventListener('click', closeTimelineModal);
document.getElementById('tlModalBackdrop').addEventListener('click', (e)=>{ if(e.target.id==='tlModalBackdrop') closeTimelineModal(); });
addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeTimelineModal(); });

/* ========= Inline Timeline (com anti-overlap + touch area) ========= */
function renderInlineTimeline(){
  const el = document.getElementById('inlineTimeline'); el.innerHTML='';
  const margin={top:10,right:10,bottom:30,left:10};
  const w = el.clientWidth - margin.left - margin.right;
  const h = el.clientHeight - margin.top - margin.bottom;
  const CENTER_Y = h/2;

  const svgRoot = d3.select(el).append('svg')
    .attr('width', w+margin.left+margin.right)
    .attr('height', h+margin.top+margin.bottom);

  const svg = svgRoot.append('g').attr('transform',`translate(${margin.left},${margin.top})`);

  // glow local para a inline
  const defs = svg.append('defs');
  const glow = defs.append('filter').attr('id','glow-inline');
  // Gradiente para a linha base
const lg = defs.append('linearGradient')
  .attr('id','tlGradInline').attr('x1','0%').attr('x2','100%');
   lg.append('stop').attr('offset','0%').attr('stop-color','#5c64f4');
   lg.append('stop').attr('offset','50%').attr('stop-color','#8e5cff');
   lg.append('stop').attr('offset','100%').attr('stop-color','#5a4bff');
  glow.append('feGaussianBlur').attr('stdDeviation','3.5').attr('result','blur');
  const merge = glow.append('feMerge');
  merge.append('feMergeNode').attr('in','blur');
  merge.append('feMergeNode').attr('in','SourceGraphic');

  const years = d3.extent(timelineData, d=> d.year + ((d.month||1)-1)/12 );
  const x = d3.scaleLinear().domain([years[0]-0.2, years[1]+0.2]).range([0,w]);
  let currentX = x;
  
// linha base (fallback visível + gradiente com glow)
const base = svg.append('g').attr('class','base-line');

base.append('line') // fallback sólido (garante visibilidade)
  .attr('x1', 0).attr('x2', w)
  .attr('y1', CENTER_Y).attr('y2', CENTER_Y)
  .attr('stroke', '#9fb3ff')
  .attr('stroke-width', 1.25)
  .attr('opacity', 0.35);

base.append('line') // camada principal com gradiente e glow
  .attr('x1', 0).attr('x2', w)
  .attr('y1', CENTER_Y).attr('y2', CENTER_Y)
  .attr('stroke', 'url(#tlGradInline)')
  .attr('stroke-width', 2.5)
  .attr('stroke-linecap', 'round')
  .attr('opacity', 0.6)
  .attr('filter', 'url(#glow-inline)')
  .style('pointer-events','none');

const todayVal = new Date().getFullYear() + new Date().getMonth()/12;
const todayX   = x(todayVal);
svg.append('line')
  .attr('class','today')
  .attr('x1',todayX).attr('x2',todayX)
  .attr('y1',CENTER_Y-28).attr('y2',CENTER_Y+28)
  .attr('stroke','#b3c7ff').attr('stroke-dasharray','4 4').attr('opacity',.35)
  .style('pointer-events','none');

  // rótulos de ano
  const ticks = d3.range(Math.floor(years[0]), Math.ceil(years[1])+1);
  svg.selectAll('text.lbl').data(ticks).enter().append('text')
    .attr('class','lbl').attr('x', d=>x(d)).attr('y', CENTER_Y+22)
    .attr('text-anchor','middle').attr('fill','#c7d2fe').attr('font-size',12)
    .text(d=>d);

  // cor do aro
  const color = d3.scaleOrdinal()
    .domain([...new Set(timelineData.map(d=>d.tech))])
    .range(d3.schemeTableau10);

  // ------- ANTI-OVERLAP (distribui em faixas) -------
  const isSmall = window.matchMedia('(max-width:640px)').matches;
  const R = 14;                     // raio visual do ponto
  const HIT_R = isSmall ? 28 : 24;  // área de toque invisível
  const SEP = isSmall ? (HIT_R*2 + 8) : (R*2 + 10); // distância mínima entre pontos na mesma faixa
  const LANE_GAP = isSmall ? 30 : 24;              // distância vertical entre faixas

  // (1) posição horizontal de cada item
const withX = timelineData.map(d => {
  const raw = d.year + ((d.month||1)-1)/12;
  return { ...d, _rawX: raw, _x: x(raw) };
}).sort((a,b)=> a._x - b._x);


  // (2) aloca em faixas: 0, +1, -1, +2, -2, ...
  function dodge(items, minSep){
    const laneLastX = []; // último x de cada faixa
    items.forEach(it=>{
      let lane = 0;
      // encontra a primeira faixa cujo último ponto esteja longe o suficiente
      while(true){
        const last = laneLastX[lane] ?? -Infinity;
        if (it._x - last >= minSep) break;
        lane++;
      }
      laneLastX[lane] = it._x;
      it._lane = lane;
    });
    return items;
  }
  function laneOffset(l){ // 0->0, 1->+1, 2->-1, 3->+2, 4->-2…
    if(l===0) return 0;
    const k = Math.ceil(l/2);
    return (l%2===1) ?  k : -k;
  }
  dodge(withX, SEP);

  // grupos dos pontos (com offset vertical & área de toque maior)
  const gpts = svg.selectAll('g.pt').data(withX).enter()
    .append('g')
    .attr('class','pt')
    .attr('transform', d=>{
      const dy = laneOffset(d._lane) * LANE_GAP;
      d._y = CENTER_Y + dy; // armazena para o conector
      return `translate(${d._x}, ${d._y})`;
    })
    .style('cursor','pointer')
    .on('click', (evt,d)=> { history.replaceState(null,'','#t='+d.id); openTimelineModal(d); });

  gpts
  .attr('tabindex', 0)
  .attr('role', 'button')
  .attr('aria-label', d=>`${d.tech}: ${d.title}`)
  .on('keydown', function(ev, d){
    const key = ev.key.toLowerCase();
    if (key==='enter' || key===' ' || key==='spacebar') {
    history.replaceState(null, '', '#t=' + d.id);
    openTimelineModal(d);
    ev.preventDefault(); // evita scroll quando apertar espaço
   }
    if(key==='arrowright' || key==='arrowleft'){
      const i = withX.indexOf(d);
      const j = Math.max(0, Math.min(withX.length-1, i + (key==='arrowright'?1:-1)));
      const nodes = svg.selectAll('g.pt').nodes();
      nodes[j].focus();
    }
  });

  // conector até a linha base (sutil – ajuda a leitura quando “subiu/desceu”)
  gpts.append('line')
    .attr('x1',0).attr('x2',0)
    .attr('y1', d=> (CENTER_Y - d._y)) // valor negativo/positivo conforme faixa
    .attr('y2', 0)
    .attr('stroke','#7B46FF').attr('stroke-width',1).attr('opacity',.25);

  // hit-area invisível para toque/click
  gpts.append('circle')
    .attr('class','hit')
    .attr('r', HIT_R)
    .attr('fill','transparent');

  // aro com glow (o “ponto” visível)
  gpts.append('circle')
    .attr('class','ring')
    .attr('r',R)
    .attr('fill','#0b0c10')
    .attr('stroke', d=>color(d.tech))
    .attr('stroke-width',2.5)
    .attr('filter','url(#glow-inline)');

  // clip circular + imagem (16px)
  gpts.each(function(d,i){
    const g = d3.select(this);
    g.append('clipPath').attr('id',`clipInline${i}`).append('circle').attr('r',R-2);
    g.append('image')
      .attr('href', (techIcon && techIcon[d.tech]) ? techIcon[d.tech] : '/assets/images/galaxy_badge.png')
      .attr('width',(R-2)*2).attr('height',(R-2)*2).attr('x',-(R-2)).attr('y',-(R-2))
      .attr('clip-path',`url(#clipInline${i})`);
  });

  // tooltip
  const oldTip = document.getElementById('inlineTip'); if (oldTip) oldTip.remove();
  const tip = d3.select('body').append('div')
    .attr('id','inlineTip')
    .style('position','fixed').style('display','none').style('z-index',55)
    .style('padding','8px 10px').style('border-radius','10px')
    .style('backdrop-filter','blur(10px)')
    .style('background','rgba(44,47,51,.55)')
    .style('border','1px solid rgba(114,137,218,.35)')
    .style('color','#F9FAFB')
    .style('pointer-events','none');

  gpts.on('mouseenter', function(evt, d){
    const g = d3.select(this);
g.append('circle')
  .attr('r', R).attr('fill','none').attr('stroke','#8e5cff').attr('opacity',.6)
  .transition().duration(900).ease(d3.easeCubicOut)
  .attr('r', R+16).attr('opacity',0).remove();

        d3.select(this).select('circle.ring').transition().attr('r', R+2);
        tip.style('display','block')
           .html(`<strong>${d.tech}</strong><br>${d.title}<br><span style="opacity:.8">${d.year}${d.month?('/'+String(d.month).padStart(2,'0')):''}</span>`);
      })
      .on('mousemove', (evt)=>{ tip.style('left',(evt.pageX+12)+'px').style('top',(evt.pageY-10)+'px'); })
      .on('mouseleave', function(){ d3.select(this).select('circle.ring').transition().attr('r',R); tip.style('display','none'); });

  // Zoom em X (1x a 4x)
const zoom = d3.zoom()
  .scaleExtent([1,4])
  .translateExtent([[0,0],[w,h]])
  .on('zoom', (ev)=>{
    const zx = ev.transform.rescaleX(x);
    currentX = zx;
    // reposiciona pontos pela coordenada crua
    svg.selectAll('g.pt')
      .attr('transform', d=>`translate(${zx(d._rawX)}, ${d._y})`);
    // move rótulos de ano e a linha "hoje"
    svg.selectAll('text.lbl').attr('x', d=>zx(d));
    const tX = zx(todayVal);
    svg.selectAll('line.today').attr('x1',tX).attr('x2',tX);
  });
svgRoot.call(zoom);

  const guide = svg.append('line')
  .attr('class','scrubber')
  .attr('y1',CENTER_Y-28).attr('y2',CENTER_Y+28)
  .attr('stroke','#94a3b8').attr('stroke-dasharray','3 4').attr('opacity',0)
  .style('pointer-events','none');  

svg.on('mousemove', (ev)=>{
  const [mx] = d3.pointer(ev);
  guide.attr('x1',mx).attr('x2',mx).attr('opacity',.25);
  let best=null, dist=1e9;
  withX.forEach(d=>{ const dx = Math.abs(mx - currentX(d._rawX)); if(dx<dist){dist=dx; best=d;} });
  svg.selectAll('g.pt').attr('opacity', d => d===best ? 1 : .35);
}).on('mouseleave', ()=>{
  guide.attr('opacity',0);
  svg.selectAll('g.pt').attr('opacity',1);
});


}

/* ========= Overlay Timeline (neon, filtros, ícones + modal) ========= */
function renderOverlayTimeline(filterSet){
  const el = document.getElementById('overlayTimeline'); el.innerHTML='';
  const dataAll = timelineData.filter(d=> filterSet.has(d.tech));
  if(!dataAll.length){ el.innerHTML = '<div class="text-indigo-200/80 p-4">Nenhum marco com os filtros atuais.</div>'; return; }

  const margin = {top:20,right:20,bottom:30,left:80};
  const w = el.clientWidth - margin.left - margin.right;
  const h = el.clientHeight - margin.top - margin.bottom;

  const svgRoot = d3.select(el).append('svg')
    .attr('width', w+margin.left+margin.right)
    .attr('height', h+margin.top+margin.bottom);

  const svg = svgRoot.append('g').attr('transform',`translate(${margin.left},${margin.top})`);
  const OR = 12; 
  const IR = OR - 2; 
  const IMG = IR * 2; 

  // glow
  const defs = svg.append('defs');
  const glow = defs.append('filter').attr('id','glow');
  glow.append('feGaussianBlur').attr('stdDeviation','3.5').attr('result','coloredBlur');
  const feMerge = glow.append('feMerge');
  feMerge.append('feMergeNode').attr('in','coloredBlur');
  feMerge.append('feMergeNode').attr('in','SourceGraphic');

  const techs = [...new Set(dataAll.map(d=>d.tech))].sort();
  const y = d3.scaleBand().domain(techs).range([0,h]).padding(0.4);
  const x = d3.scaleLinear()
              .domain(d3.extent(dataAll, d=> d.year + ((d.month||1)-1)/12))
              .nice().range([0,w]);

  // linhas por tecnologia
  svg.selectAll('line.row').data(techs).enter().append('line')
    .attr('x1',0).attr('x2',w)
    .attr('y1', d=>y(d)+y.bandwidth()/2).attr('y2', d=>y(d)+y.bandwidth()/2)
    .attr('class','neon-line').attr('opacity',.35);

  // labels
  svg.selectAll('text.tech').data(techs).enter().append('text')
    .attr('x',-10).attr('y', d=>y(d)+y.bandwidth()/2)
    .attr('text-anchor','end').attr('dominant-baseline','middle')
    .attr('fill','#c7d2fe').text(d=>d);

  // cor do aro
  const color = d3.scaleOrdinal().domain(techs).range(d3.schemeTableau10);

  // grupos clicáveis (com ícone)
  const pts = svg.selectAll('g.pt').data(dataAll).enter()
    .append('g')
    .attr('class','pt')
    .attr('transform', d=> `translate(${x(d.year+((d.month||1)-1)/12)}, ${y(d.tech)+y.bandwidth()/2})`)
    .style('cursor','pointer')
    .on('click', (evt, d)=> openTimelineModal(d));

  // aro (com glow) + miolo escuro
  pts.append('circle')
    .attr('r', 9)
    .attr('class', 'neon-dot')
    .attr('fill', '#0b0c10')
    .attr('stroke', d=> color(d.tech))
    .attr('stroke-width', 2.5);

  // imagem recortada no círculo
  pts.each(function(d,i){
    const g = d3.select(this);
    const clipId = `clipOverlay${i}`;
    g.append('clipPath').attr('id', clipId)
      .append('circle').attr('r', 7.5);
    g.append('image')
      .attr('href', techIcon[d.tech] || TL_FALLBACK_ICON)
      .attr('width', 15).attr('height', 15)
      .attr('x', -7.5).attr('y', -7.5)
      .attr('preserveAspectRatio', 'xMidYMid slice')
      .attr('clip-path', `url(#${clipId})`);
  });

  // ripple sutil
  pts.append('circle').attr('r', 7.5).attr('fill','none')
    .attr('stroke', d=>color(d.tech)).attr('opacity', .6)
    .transition().duration(1200).ease(d3.easeCubic)
    .attr('r', 22).attr('opacity', 0).on('end', function(){ d3.select(this).remove(); });

  // eixo X (anos)
  const xAxis = d3.axisBottom(x).ticks(6).tickFormat(d3.format('d'));
  svg.append('g').attr('transform',`translate(0,${h})`).call(xAxis)
    .selectAll('text').attr('fill','#c7d2fe');
  svg.selectAll('.domain, .tick line').attr('stroke','#94a3b8');
}

    // Inicializa Inline Timeline
    renderInlineTimeline();
    addEventListener('resize', ()=>{ renderInlineTimeline(); });

    // Overlay handlers
    (function(){
      const overlay=document.getElementById('timelineOverlay');
      const openBtns=[document.getElementById('openTimelineBtn'), document.getElementById('openTimelineBtn2')];
      const closeBtn=document.getElementById('closeTimelineBtn');
      function open(){ overlay.classList.remove('hidden'); const checks=[...document.querySelectorAll('.techFilter')]; const set=new Set(checks.filter(c=>c.checked).map(c=>c.value)); renderOverlayTimeline(set); }
      function close(){ overlay.classList.add('hidden'); }
      openBtns.forEach(b=>b.addEventListener('click', open));
      closeBtn.addEventListener('click', close);
      overlay.addEventListener('click', (e)=>{ if(e.target===overlay) close(); });
      document.querySelectorAll('.techFilter').forEach(chk=>{ chk.addEventListener('change',()=>{
        const checks=[...document.querySelectorAll('.techFilter')]; const set=new Set(checks.filter(c=>c.checked).map(c=>c.value)); renderOverlayTimeline(set);
      }); });
    })();

window.addEventListener('load', () => {
  const nav = performance.getEntriesByType('navigation')[0];
  const isReload = nav && nav.type === 'reload';

  const m = location.hash.match(/^#t=(.+)$/);
  if (!m || isReload) return;

  const found = timelineData.find(d => d.id === m[1]);
  if (found) openTimelineModal(found);
});


async function downloadTimelinePNG(){
  const svgEl = document.querySelector('#inlineTimeline svg');
  if(!svgEl) return;
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([svgData], {type:'image/svg+xml'});
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = ()=>{
    const canvas = document.createElement('canvas');
    canvas.width = svgEl.clientWidth;
    canvas.height = svgEl.clientHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img,0,0);
    const a = document.createElement('a');
    a.download = 'timeline.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    URL.revokeObjectURL(url);
  };
  img.src = url;
}
