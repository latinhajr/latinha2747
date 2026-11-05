/* ============================================================
   VINTTESETE — app.js
   Header/footer, busca, carrinho, filtros, produto, checkout,
   conta, admin, chatbot e WhatsApp. Tudo em JS puro.
   ============================================================ */

/* ---------- Utilidades ---------- */
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
const money = (v) => "R$ " + v.toFixed(2).replace(".", ",");
const stars = (n) => "★★★★★".slice(0, Math.round(n)) + "☆☆☆☆☆".slice(0, 5 - Math.round(n));
const catNome = (id) => (CATEGORIAS.find((c) => c.id === id) || {}).nome || id;
const totalEstoque = (p) => Object.values(p.estoque).reduce((a, b) => a + b, 0);
const getProduto = (id) => PRODUTOS.find((p) => p.id === Number(id));
const qs = (k) => new URLSearchParams(location.search).get(k);

const store = {
  get(k, def) { try { return JSON.parse(localStorage.getItem("vt_" + k)) ?? def; } catch { return def; } },
  set(k, v) { localStorage.setItem("vt_" + k, JSON.stringify(v)); },
};

function toast(msg) {
  let wrap = $(".toast-wrap");
  if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

/* ---------- Carrinho ---------- */
const cart = {
  itens: () => {const items=store.get("cart",[]);return (Array.isArray(items)?items:[]).filter(i=>{const p=i&&getProduto(i.id);return p&&p.cores.includes(i.cor)&&p.estoque[i.tam]>0;}).map(i=>({...i,qtd:Math.min(getProduto(i.id).estoque[i.tam],Math.max(1,parseInt(i.qtd,10)||1))}));},
  salvar(itens) { store.set("cart", itens); pintarCarrinho(); },
  add(id, tam, cor, qtd = 1) {
    const itens = cart.itens();
    const chave = id + "|" + tam + "|" + cor;
    const achou = itens.find((i) => i.chave === chave);
    if (achou) achou.qtd = Math.min(getProduto(id).estoque[tam],achou.qtd+qtd);
    else itens.push({ chave, id, tam, cor, qtd });
    cart.salvar(itens);
    toast("Adicionado à sacola!");
  },
  mudarQtd(chave, delta) {
    const itens = cart.itens();
    const it = itens.find((i) => i.chave === chave);
    if (!it) return;
    it.qtd = Math.min(getProduto(it.id).estoque[it.tam],Math.max(1, it.qtd + delta));
    cart.salvar(itens);
  },
  remover(chave) { cart.salvar(cart.itens().filter((i) => i.chave !== chave)); toast("Item removido"); },
  limpar() { cart.salvar([]); },
  subtotal() { return cart.itens().reduce((s, i) => s + (getProduto(i.id)?.preco || 0) * i.qtd, 0); },
  frete() { const s = cart.subtotal(); return s === 0 || s >= 249 ? 0 : 24.9; },
  total() { return cart.subtotal() + cart.frete() - cart.desconto(); },
  desconto() { const c = store.get("cupom", null); return c ? cart.subtotal() * 0.1 : 0; },
  qtdTotal() { return cart.itens().reduce((s, i) => s + i.qtd, 0); },
};

/* ---------- Header / Footer / Flutuantes ---------- */
function montarLayout() {
  const pagina = document.body.dataset.pagina || "";
  const header = document.createElement("div");
  header.innerHTML = `
    <div class="topbar"><span>FRETE GRÁTIS ACIMA DE R$ 249 &nbsp;•&nbsp; PAGAMENTO A COMBINAR &nbsp;•&nbsp; TROCA FÁCIL EM 30 DIAS &nbsp;•&nbsp; VINTTESETE — SÓ CALÇA, SÓ STREET &nbsp;•&nbsp; DROP NOVO TODA SEXTA</span></div>
    <header class="site">
      <nav class="nav">
        <a href="index.html" class="logo"><img src="images/logo.png" alt="Vinttesete" width="200" height="100"></a>
        <button class="icon-btn burger" id="burger" aria-label="Menu">☰</button>
        <div class="nav-links" id="navLinks">
          <a href="index.html" class="${pagina === "home" ? "active" : ""}">Home</a>
          <a href="catalogo.html" class="${pagina === "catalogo" ? "active" : ""}">Catálogo</a>
          <a href="catalogo.html?cat=cargo">Cargo</a>
          <a href="catalogo.html?cat=baggy">Baggy</a>
          <a href="catalogo.html?cat=moletom">Moletom</a>
          <a href="conta.html" class="${pagina === "conta" ? "active" : ""}">Minha conta</a>
        </div>
        <div class="search-wrap">
          <input id="buscaTopo" type="search" placeholder="Buscar calça, categoria..." autocomplete="off" aria-label="Buscar">
          <div class="suggest" id="suggest"></div>
        </div>
        <div class="nav-actions">
          <a class="icon-btn" href="conta.html" aria-label="Conta"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg></a>
          <button class="icon-btn" id="abrirCarrinho" aria-label="Sacola"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg><span class="cart-count" id="cartCount">0</span></button>
        </div>
      </nav>
    </header>`;
  document.body.prepend(header);

  const footer = document.createElement("footer");
  footer.className = "site";
  footer.innerHTML = `
    <div class="container footer-grid">
      <div>
        <img src="images/logo.png" alt="Vinttesete" style="height:42px;width:auto">
        <p style="margin-top:12px">Streetwear de verdade, feito só de calça. Modelagens amplas, tecidos premium e arte urbana em cada peça.</p>
        <div class="social">
          <a href="${INSTAGRAM}" target="_blank" rel="noopener" aria-label="Instagram">IG</a>
          <a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener" aria-label="WhatsApp">WA</a>
          <a href="#" aria-label="TikTok">TT</a>
        </div>
      </div>
      <div>
        <h4>Categorias</h4>
        ${CATEGORIAS.map((c) => `<a href="catalogo.html?cat=${c.id}">${c.nome}</a>`).join("")}
      </div>
      <div>
        <h4>Ajuda</h4>
        <a href="#" onclick="abrirChat();return false">Fale com a gente</a>
        <a href="https://wa.me/${WHATSAPP}" target="_blank" rel="noopener">WhatsApp</a>
        <a href="conta.html">Meus pedidos</a>
        <a href="#">Trocas e devoluções</a>
        <a href="#">Guia de medidas</a>
      </div>
      <div>
        <h4>Loja</h4>
        <a href="catalogo.html">Todos os modelos</a>
        <a href="carrinho.html">Sacola</a>
        <a href="checkout.html">Checkout</a>
        <a href="login.html">Painel admin</a>
      </div>
    </div>
    <div class="container copy">© ${new Date().getFullYear()} Vinttesete — CNPJ 27.027.027/0001-27 — Todos os direitos reservados.</div>`;
  document.body.appendChild(footer);

  const flut = document.createElement("div");
  flut.innerHTML = `
    <div class="drawer-bg" id="drawerBg"></div>
    <aside class="drawer" id="drawer" aria-label="Sacola">
      <div class="head"><strong style="font-family:var(--titulo);font-size:1.3rem">Sua sacola</strong><button class="link-x" id="fecharDrawer">Fechar ✕</button></div>
      <div class="body" id="drawerBody"></div>
      <div class="foot">
        <div class="linha total"><span>Total</span><span id="drawerTotal">R$ 0,00</span></div>
        <a class="btn block" href="checkout.html">Finalizar compra</a>
        <a class="btn ghost block" href="carrinho.html">Ver sacola completa</a>
      </div>
    </aside>
    <div class="float-wrap">
      <div class="chatbox" id="chatbox">
        <div class="head"><strong>Zé do 27 · Atendimento</strong><button class="link-x" id="fecharChat">✕</button></div>
        <div class="msgs" id="chatMsgs"></div>
        <div class="quick">
          <button data-q="Qual o prazo de entrega?">Entrega</button>
          <button data-q="Como funciona a troca?">Troca</button>
          <button data-q="Qual tamanho eu escolho?">Tamanhos</button>
          <button data-q="Quais formas de pagamento?">Pagamento</button>
        </div>
        <form id="chatForm"><input id="chatInput" placeholder="Escreva sua dúvida..." autocomplete="off"><button class="send" type="submit">Enviar</button></form>
      </div>
      <button class="fab bot" id="abrirChat" aria-label="Chat"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/></svg></button>
      <a class="fab wa" href="https://wa.me/${WHATSAPP}?text=Ol%C3%A1%20Vinttesete!%20Quero%20ajuda%20com%20uma%20cal%C3%A7a." target="_blank" rel="noopener" aria-label="WhatsApp"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.1-.7.1l-.7.9c-.1.2-.3.2-.5.1a7.3 7.3 0 0 1-3.6-3.6c-.1-.2 0-.4.1-.5l.9-.7c.2-.2.2-.4.1-.7-.1-.2-.8-1.7-1-2-.2-.4-.5-.3-.7-.3-.8 0-1.9.9-1.9 2.4 0 1.4 1 2.9 1.2 3.2 1 1.6 2.5 3 4.4 3.7 1.4.5 2.6.5 3.2.3.8-.2 1.6-1.1 1.6-1.9 0-.2 0-.4-.4-.5z"/><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20z"/></svg></a>
    </div>`;
  document.body.appendChild(flut);

  /* eventos do layout */
  $("#burger").onclick = () => $("#navLinks").classList.toggle("on");
  $("#abrirCarrinho").onclick = abrirDrawer;
  $("#fecharDrawer").onclick = fecharDrawer;
  $("#drawerBg").onclick = fecharDrawer;
  $("#abrirChat").onclick = abrirChat;
  $("#fecharChat").onclick = () => $("#chatbox").classList.remove("on");
  $("#chatForm").onsubmit = (e) => { e.preventDefault(); enviarChat($("#chatInput").value); $("#chatInput").value = ""; };
  $$(".chatbox .quick button").forEach((b) => (b.onclick = () => enviarChat(b.dataset.q)));
  ligarBusca();
  pintarCarrinho();
}

/* ---------- Busca com sugestões ---------- */
function ligarBusca() {
  const input = $("#buscaTopo");
  const box = $("#suggest");
  input.addEventListener("input", () => {
    const t = input.value.trim().toLowerCase();
    if (t.length < 2) return box.classList.remove("on");
    const achados = PRODUTOS.filter((p) => (p.nome + " " + catNome(p.cat)).toLowerCase().includes(t)).slice(0, 5);
    box.innerHTML = achados.length
      ? achados.map((p) => `<a href="produto.html?id=${p.id}"><img src="${p.img}" alt="${p.nome}"><span>${p.nome}<br><small class="muted">${catNome(p.cat)} · ${money(p.preco)}</small></span></a>`).join("")
      : `<a href="catalogo.html?q=${encodeURIComponent(t)}">Nenhum resultado direto — ver catálogo</a>`;
    box.classList.add("on");
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") location.href = "catalogo.html?q=" + encodeURIComponent(input.value.trim());
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".search-wrap")) box.classList.remove("on"); });
}

/* ---------- Drawer / contador ---------- */
function abrirDrawer() { $("#drawer").classList.add("on"); $("#drawerBg").classList.add("on"); }
function fecharDrawer() { $("#drawer").classList.remove("on"); $("#drawerBg").classList.remove("on"); }

function pintarCarrinho() {
  const c = $("#cartCount");
  if (c) c.textContent = cart.qtdTotal();
  const body = $("#drawerBody");
  if (body) {
    const itens = cart.itens();
    body.innerHTML = itens.length
      ? itens.map((i) => {
          const p = getProduto(i.id);
          return `<div class="item-carrinho">
            <img src="${p.img}" alt="${p.nome}">
            <div><strong>${p.nome}</strong><div class="muted" style="font-size:.8rem">${i.tam} · ${i.cor} · ${i.qtd}x</div><div class="amarelo">${money(p.preco * i.qtd)}</div></div>
            <button class="link-x" onclick="cart.remover('${i.chave}')">✕</button>
          </div>`;
        }).join("")
      : `<p class="muted" style="padding:24px 0">Sua sacola está vazia. Bora escolher uma calça?</p>`;
    $("#drawerTotal").textContent = money(cart.total());
  }
  if (typeof pintarPaginaCarrinho === "function") pintarPaginaCarrinho();
}

/* ---------- Card de produto ---------- */
function cardProduto(p, i = 0) {
  const est = totalEstoque(p);
  const cls = est === 0 ? "zero" : est < 8 ? "baixo" : "ok";
  const txt = est === 0 ? "Esgotado" : est < 8 ? "Últimas peças" : "Em estoque";
  const off = p.de ? `<span class="badge off">-${Math.round((1 - p.preco / p.de) * 100)}%</span>` : "";
  const novo = p.tags.includes("novo") ? `<span class="badge navy" style="left:auto;right:10px">Novo</span>` : "";
  return `<article class="card" style="animation-delay:${Math.min(i * 45, 400)}ms">
    <a class="thumb" href="produto.html?id=${p.id}">${off}${novo}<img src="${p.img}" alt="${p.nome}" loading="lazy"></a>
    <div class="info">
      <span class="cat-label">${catNome(p.cat)}</span>
      <h3><a href="produto.html?id=${p.id}">${p.nome}</a></h3>
      <div class="stars">${stars(p.nota)} <small>${p.nota.toFixed(1)} (${p.avaliacoes})</small></div>
      <span class="estoque ${cls}">${txt}</span>
      <div class="price">${p.de ? `<s>${money(p.de)}</s>` : ""}<strong>${money(p.preco)}</strong></div>
      <a class="btn sm" href="produto.html?id=${p.id}">Ver peça</a>
    </div>
  </article>`;
}

/* ---------- Chatbot ---------- */
function abrirChat() {
  const box = $("#chatbox");
  box.classList.add("on");
  if (!$("#chatMsgs").children.length) {
    botFala("E aí! Sou o Zé do 27 👋 Posso te ajudar com tamanho, entrega, troca ou pagamento.");
  }
}
function botFala(txt) {
  const d = document.createElement("div");
  d.className = "msg bot";
  d.textContent = txt;
  $("#chatMsgs").appendChild(d);
  $("#chatMsgs").scrollTop = 9999;
}
function enviarChat(txt) {
  if (!txt || !txt.trim()) return;
  const d = document.createElement("div");
  d.className = "msg user";
  d.textContent = txt;
  $("#chatMsgs").appendChild(d);
  $("#chatMsgs").scrollTop = 9999;
  setTimeout(() => botFala(respostaBot(txt.toLowerCase())), 550);
}
function respostaBot(t) {
  if (/entreg|prazo|frete|chega/.test(t)) return "Enviamos em até 24h úteis. Sudeste 2-4 dias, demais regiões 4-8 dias. Frete grátis acima de R$ 249!";
  if (/troca|devolu|arrepend/.test(t)) return "Troca fácil em 30 dias: é só falar aqui ou no WhatsApp que a gente manda a etiqueta de postagem.";
  if (/tamanh|medida|veste|numera/.test(t)) return "Nossas modelagens são amplas. Se você usa 40, o M cai certinho. Na dúvida entre dois tamanhos, pegue o menor nas baggy e o maior nas cargo.";
  if (/pagam|pix|cart|parcel|boleto/.test(t)) return "A loja combina o pagamento pelo WhatsApp após receber seu pedido. Não há cobrança automática pelo site.";
  if (/personaliz|custom|pintad/.test(t)) return "Peças personalizadas são só via direct no Instagram: " + INSTAGRAM + " — fala com a gente por lá!";
  if (/cargo|baggy|flare|reta|balão|balao|moletom/.test(t)) return "Temos esse modelo sim! Dá uma olhada no catálogo filtrando pela categoria — tem drop novo toda sexta.";
  if (/desconto|cupom|promo/.test(t)) return "Use o cupom VINTTE10 no carrinho para 10% de desconto na primeira compra.";
  if (/oi|ola|olá|eae|bom dia|boa tarde|boa noite/.test(t)) return "Fala! Como posso ajudar? Posso falar de tamanhos, entrega, troca ou pagamento.";
  return "Boa pergunta! Posso te passar pro time humano no WhatsApp: wa.me/" + WHATSAPP + " — respondemos rapidinho.";
}

/* ---------- Home ---------- */
function initHome() {
  $("#homeCats").innerHTML = CATEGORIAS.map(
    (c) => `<a class="cat" href="catalogo.html?cat=${c.id}">${c.nome}<span>${c.desc}</span></a>`
  ).join("");
  $("#homeDestaques").innerHTML = PRODUTOS.filter((p) => p.tags.includes("destaque")).slice(0, 8).map(cardProduto).join("");
  $("#homeNovos").innerHTML = PRODUTOS.filter((p) => p.tags.includes("novo")).slice(0, 4).map(cardProduto).join("");
  observarAnimacao();
}

function observarAnimacao() {
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) { e.target.style.animation = "fadeUp .6s both"; io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$("section .sec-head, .faixa").forEach((el) => io.observe(el));
}

/* ---------- Catálogo ---------- */
const filtros = { cats: [], tams: [], cores: [], max: 250, q: "", ordem: "relevancia" };

function initCatalogo() {
  const catUrl = qs("cat");
  if (catUrl) filtros.cats = [catUrl];
  filtros.q = qs("q") || "";
  if (filtros.q) $("#buscaTopo").value = filtros.q;

  $("#fCategorias").innerHTML = CATEGORIAS.map(
    (c) => `<label class="check"><input type="checkbox" value="${c.id}" ${filtros.cats.includes(c.id) ? "checked" : ""}> ${c.nome}</label>`
  ).join("");
  $("#fTamanhos").innerHTML = TAMANHOS.map((t) => `<button class="chip" data-tam="${t}">${t}</button>`).join("");
  const cores = [...new Set(PRODUTOS.flatMap((p) => p.cores))];
  $("#fCores").innerHTML = cores.map((c) => `<button class="chip" data-cor="${c}">${c}</button>`).join("");

  $$("#fCategorias input").forEach((i) => (i.onchange = () => {
    filtros.cats = $$("#fCategorias input:checked").map((x) => x.value);
    render();
  }));
  $$("#fTamanhos .chip").forEach((b) => (b.onclick = () => {
    b.classList.toggle("on");
    filtros.tams = $$("#fTamanhos .chip.on").map((x) => x.dataset.tam);
    render();
  }));
  $$("#fCores .chip").forEach((b) => (b.onclick = () => {
    b.classList.toggle("on");
    filtros.cores = $$("#fCores .chip.on").map((x) => x.dataset.cor);
    render();
  }));
  $("#fPreco").oninput = (e) => { filtros.max = Number(e.target.value); $("#fPrecoVal").textContent = money(filtros.max); render(); };
  $("#ordenar").onchange = (e) => { filtros.ordem = e.target.value; render(); };
  $("#limpar").onclick = () => location.href = "catalogo.html";
  $("#toggleFiltros").onclick = () => $("#filtros").classList.toggle("on");

  render();

  function render() {
    let lista = PRODUTOS.filter((p) => {
      if (filtros.cats.length && !filtros.cats.includes(p.cat)) return false;
      if (filtros.cores.length && !p.cores.some((c) => filtros.cores.includes(c))) return false;
      if (filtros.tams.length && !filtros.tams.some((t) => p.estoque[t] > 0)) return false;
      if (p.preco > filtros.max) return false;
      if (filtros.q && !(p.nome + " " + catNome(p.cat) + " " + p.desc).toLowerCase().includes(filtros.q.toLowerCase())) return false;
      return true;
    });
    const ord = {
      menor: (a, b) => a.preco - b.preco,
      maior: (a, b) => b.preco - a.preco,
      nota: (a, b) => b.nota - a.nota,
      relevancia: (a, b) => b.tags.length - a.tags.length || b.nota - a.nota,
    }[filtros.ordem];
    lista.sort(ord);
    $("#contagem").textContent = lista.length + (lista.length === 1 ? " peça encontrada" : " peças encontradas");
    $("#gridCatalogo").innerHTML = lista.length
      ? lista.map(cardProduto).join("")
      : `<p class="muted">Nada encontrado com esses filtros. <button class="link-x" onclick="location.href='catalogo.html'">Limpar filtros</button></p>`;
    $("#tituloCatalogo").textContent = filtros.q ? `Busca: "${filtros.q}"` : filtros.cats.length === 1 ? catNome(filtros.cats[0]) : "Todas as calças";
  }
}

/* ---------- Produto ---------- */
function initProduto() {
  const p = qs("id") ? getProduto(qs("id")) : PRODUTOS[0];
  if (!p) { $("#prodBox").innerHTML = `<div class="painel-box"><h2>Peça indisponível</h2><p>Esta peça não está mais no catálogo.</p><a class="btn" href="catalogo.html">Ver catálogo</a></div>`; return; }
  document.title = p.nome + " · Vinttesete";
  let tam = TAMANHOS.find((t) => p.estoque[t] > 0) || "M";
  let cor = p.cores[0];
  let qtd = 1;

  $("#prodBox").innerHTML = `
    <div class="galeria">
      <div class="principal"><img id="imgPrincipal" src="${p.img}" alt="${p.nome}"></div>
      <div class="minis">
  <img class="on" src="${p.img}" alt="${p.nome} — frente">
  <img
    src="${p.img.replace(/(\.[^/.]+)$/, '-vestida$1')}"
    alt="${p.nome} — vestida"
    onerror="this.remove()"
  >
</div>
    </div>
    <div>
      <span class="cat-label" style="color:var(--amarelo);letter-spacing:.2em;font-size:.7rem">${catNome(p.cat)}</span>
      <h1>${p.nome}</h1>
      <div class="stars" style="margin:8px 0">${stars(p.nota)} <small>${p.nota.toFixed(1)} · ${p.avaliacoes} avaliações</small></div>
      <div class="price" style="align-items:baseline;gap:12px">
        ${p.de ? `<s>${money(p.de)}</s>` : ""}<span class="preco-grande">${money(p.preco)}</span>
      </div>
      <p class="muted" style="font-size:.85rem">Pagamento e entrega a combinar com a loja</p>
      <p style="margin-top:14px">${p.desc}</p>
      <div class="opcoes">
        <div><label>Tamanho</label><div class="chips" id="opTam"></div></div>
        <div><label>Cor</label><div class="chips" id="opCor"></div></div>
        <div><label>Quantidade</label>
          <div class="qtd"><button id="menos">−</button><span id="qtdVal">1</span><button id="mais">+</button></div>
        </div>
      </div>
      <p class="estoque ${totalEstoque(p) < 8 ? "baixo" : "ok"}" id="estoqueTxt"></p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
        <button class="btn" id="addCart">Adicionar à sacola</button>
        <button class="btn navy" id="comprarJa">Comprar agora</button>
      </div>
      <a class="btn ghost sm" style="margin-top:12px" href="https://wa.me/${WHATSAPP}?text=Tenho%20interesse%20na%20${encodeURIComponent(p.nome)}" target="_blank" rel="noopener">Tirar dúvida no WhatsApp</a>
    </div>`;

  const pintarOpcoes = () => {
    $("#opTam").innerHTML = TAMANHOS.map((t) => `<button class="chip ${t === tam ? "on" : ""}" data-t="${t}" ${p.estoque[t] === 0 ? "disabled style=opacity:.35" : ""}>${t}</button>`).join("");
    $("#opCor").innerHTML = p.cores.map((c) => `<button class="chip ${c === cor ? "on" : ""}" data-c="${c}">${c}</button>`).join("");
    $("#estoqueTxt").textContent = p.estoque[tam] > 0 ? `${p.estoque[tam]} unidade(s) do tamanho ${tam} em estoque` : "Tamanho esgotado";
    $$("#opTam .chip").forEach((b) => (b.onclick = () => { tam = b.dataset.t; pintarOpcoes(); }));
    $$("#opCor .chip").forEach((b) => (b.onclick = () => { cor = b.dataset.c; pintarOpcoes(); }));
  };
  pintarOpcoes();

  $("#menos").onclick = () => { qtd = Math.max(1, qtd - 1); $("#qtdVal").textContent = qtd; };
  $("#mais").onclick = () => { qtd = Math.min(p.estoque[tam] || 1, qtd + 1); $("#qtdVal").textContent = qtd; };
  $("#addCart").onclick = () => { if (!p.estoque[tam]) return toast("Tamanho esgotado"); cart.add(p.id, tam, cor, qtd); abrirDrawer(); };
  $("#comprarJa").onclick = () => { if (!p.estoque[tam]) return toast("Tamanho esgotado"); cart.add(p.id, tam, cor, qtd); location.href = "checkout.html"; };
  $$(".minis img").forEach((m) => (m.onclick = () => {
    $$(".minis img").forEach((x) => x.classList.remove("on"));
    m.classList.add("on");
    $("#imgPrincipal").src = m.src;
  }));

  /* abas */
  $$(".tabs button").forEach((b) => (b.onclick = () => {
    $$(".tabs button").forEach((x) => x.classList.remove("on"));
    $$(".painel").forEach((x) => x.classList.remove("on"));
    b.classList.add("on");
    $("#" + b.dataset.painel).classList.add("on");
  }));

  pintarAvaliacoes(p.id);
  $("#formAvaliacao").onsubmit = async (e) => {
    e.preventDefault();
    try {await EcoAPI.call('reviews/'+p.id,'POST',{rating:Number($("#avNota").value),text:$("#avTexto").value});e.target.reset();await pintarAvaliacoes(p.id);toast('Obrigado pela avaliação!');}catch(x){toast(x.message);}
  };

  $("#relacionados").innerHTML = PRODUTOS.filter((x) => x.cat === p.cat && x.id !== p.id)
    .concat(PRODUTOS.filter((x) => x.cat !== p.cat))
    .slice(0, 4).map(cardProduto).join("");
}

async function pintarAvaliacoes(id) {
  try {const todas=await EcoAPI.call('reviews/'+id);$("#listaAvaliacoes").innerHTML=todas.length?todas.map(a=>`<div class="avaliacao"><header><strong>${EcoAPI.escape(a.nome)}</strong><span class="stars">${stars(a.nota)}</span></header><p class="muted">${new Date(a.created*1000).toLocaleDateString('pt-BR')}</p><p>${EcoAPI.escape(a.texto)}</p></div>`).join(''):'<p class="muted">Ainda sem avaliações. Entre na sua conta para avaliar esta peça.</p>';}
  catch(x){$("#listaAvaliacoes").textContent='As avaliações estarão disponíveis após a configuração do banco.';}
}

/* ---------- Página carrinho ---------- */
function initCarrinho() {
  window.pintarPaginaCarrinho = () => {
    const itens = cart.itens();
    $("#listaCarrinho").innerHTML = itens.length
      ? itens.map((i) => {
          const p = getProduto(i.id);
          return `<div class="item-carrinho">
            <img src="${p.img}" alt="${p.nome}">
            <div>
              <strong>${p.nome}</strong>
              <div class="muted" style="font-size:.82rem">${catNome(p.cat)} · Tam ${i.tam} · ${i.cor}</div>
              <div class="qtd" style="margin-top:8px">
                <button onclick="cart.mudarQtd('${i.chave}',-1)">−</button><span>${i.qtd}</span><button onclick="cart.mudarQtd('${i.chave}',1)">+</button>
              </div>
            </div>
            <div style="text-align:right">
              <div class="amarelo" style="font-family:var(--titulo);font-size:1.2rem">${money(p.preco * i.qtd)}</div>
              <button class="link-x" onclick="cart.remover('${i.chave}')">remover</button>
            </div>
          </div>`;
        }).join("")
      : `<p class="muted" style="padding:20px 0">Sacola vazia. <a class="amarelo" href="catalogo.html">Ver catálogo →</a></p>`;
    $("#subtotal").textContent = money(cart.subtotal());
    $("#frete").textContent = cart.frete() ? money(cart.frete()) : "Grátis";
    $("#descontoLinha").style.display = cart.desconto() ? "flex" : "none";
    $("#desconto").textContent = "− " + money(cart.desconto());
    $("#totalCarrinho").textContent = money(cart.total());
  };
  pintarPaginaCarrinho();
  $("#formCupom").onsubmit = (e) => {
    e.preventDefault();
    if ($("#cupom").value.trim().toUpperCase() === "VINTTE10") { store.set("cupom", "VINTTE10"); toast("Cupom aplicado: 10% off"); }
    else toast("Cupom inválido");
    pintarPaginaCarrinho();
  };
}

/* ---------- Checkout ---------- */
function initCheckout() {
  const root=$("#checkoutConteudo");
  root.innerHTML=`<div class="sec-head"><div><span class="tag">Seu pedido</span><h2>Finalizar sacola</h2></div></div><div class="duas-colunas"><form class="painel-box" id="orderForm"><h4>Contato e entrega</h4><p class="muted">Entre na sua conta para registrar o pedido. A loja confirma disponibilidade, entrega e pagamento pelo WhatsApp.</p><div class="form-grid"><input class="campo" id="orderName" placeholder="Nome completo" required maxlength="120"><input class="campo" id="orderPhone" placeholder="WhatsApp" type="tel" required maxlength="60"><textarea class="campo full" id="orderAddress" placeholder="Endereço de entrega ou retirada na loja" required maxlength="1000"></textarea></div><p class="muted" style="margin:16px 0">Nenhuma cobrança é realizada neste site. Não informe dados de cartão.</p><button class="btn" id="sendOrder" type="submit">Registrar pedido</button><a class="btn ghost" href="login.html">Entrar / criar conta</a><p id="orderMessage" role="status"></p></form><aside class="painel-box"><h4>Resumo</h4><div id="summary"></div><div class="linha"><span>Frete padrão estimado</span><span>${money(cart.frete())}</span></div><div class="linha"><span>Desconto</span><span>${money(cart.desconto())}</span></div><div class="linha total"><span>Total estimado</span><span>${money(cart.total())}</span></div><p class="muted">Valores de entrega sujeitos à confirmação da loja.</p></aside></div>`;
  $("#summary").innerHTML=cart.itens().map(i=>{const p=getProduto(i.id);return p?`<div class="linha"><span>${i.qtd}× ${p.nome} (${EcoAPI.escape(i.tam)})</span><span>${money(p.preco*i.qtd)}</span></div>`:'';}).join('')||'<p>Sacola vazia</p>';
  EcoAPI.call('me').then(d=>{if(d.user)$("#orderName").value=d.user.name;}).catch(()=>{});
  $("#orderForm").onsubmit=async e=>{e.preventDefault();const b=$("#sendOrder");b.disabled=true;try{const r=await EcoAPI.call('orders','POST',{items:cart.itens(),coupon:store.get('cupom',''),contact:{name:$("#orderName").value,phone:$("#orderPhone").value,address:$("#orderAddress").value}});cart.limpar();store.set('cupom',null);const msg='Olá! Registrei o pedido '+r.id+' na Vinttesete. Total estimado: '+money(r.total)+'. Quero combinar entrega e pagamento.';root.innerHTML=`<div class="painel-box center"><h2>Pedido registrado</h2><p>${EcoAPI.escape(r.id)}</p><p>${EcoAPI.escape(r.status)}</p><p class="muted">O pagamento ainda precisa ser combinado e confirmado pela loja.</p><a class="btn" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Combinar pelo WhatsApp</a><a class="btn ghost" href="conta.html">Ver meus pedidos</a></div>`;}catch(x){$("#orderMessage").textContent=x.message;b.disabled=false;}};
}

async function initConta() {
  $("#formLogin").onsubmit=e=>{e.preventDefault();location.href='login.html';};
  $("#formCadastro").onsubmit=e=>{e.preventDefault();location.href='login.html';};
  $("#areaLogin").innerHTML='<div class="painel-box"><h4>Sua conta na Vinttesete</h4><p class="muted">Entre para acompanhar seus pedidos ou criar uma conta de cliente.</p><a class="btn" href="login.html">Entrar / criar conta</a></div>';
  try{const d=await EcoAPI.call('me');const u=d.user;$("#areaLogin").style.display=u?'none':'block';$("#areaLogada").style.display=u?'block':'none';if(!u)return;$("#nomeUser").textContent=u.name;$("#emailUser").textContent=u.email;
  if(u.role==='admin')$("#emailUser").insertAdjacentHTML('afterend','<p><a class="btn" href="admin.php">Abrir painel administrativo</a></p>');
  const orders=await EcoAPI.call('orders');$("#meusPedidos").innerHTML=orders.length?'<div class="tabela-wrap"><table><thead><tr><th>Pedido</th><th>Total</th><th>Status</th></tr></thead><tbody>'+orders.map(o=>`<tr><td>${EcoAPI.escape(o.id)}</td><td>${money(Number(o.total))}</td><td>${EcoAPI.escape(o.status)}</td></tr>`).join('')+'</tbody></table></div>':'<p class="muted">Você ainda não tem pedidos.</p>';
  $("#sair").onclick=async()=>{try{await EcoAPI.call('logout','POST');location.reload();}catch(x){toast(x.message);}};
  }catch(x){toast(x.message);}
}

/* ---------- Admin ---------- */
/* ---------- Boot ---------- */
window.__vtInit = () => {
  montarLayout();
  const p = document.body.dataset.pagina;
  ({ home: initHome, catalogo: initCatalogo, produto: initProduto, carrinho: initCarrinho, checkout: initCheckout, conta: initConta, admin: () => location.href="admin.php" }[p] || (() => {}))();
};
