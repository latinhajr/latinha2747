/* ==========================================================
   QUARENTA&SETE — comportamento do site (JS puro)
   ========================================================== */
(function () {
  "use strict";

  var Q = window.Q47 || {};
  var brand = Q.brand || {};
  var CART_KEY = "q47_cart";

  /* ---------- caminhos ----------
     Os caminhos de imagem do data.js ("../img/...") são relativos à pasta assets/,
     mas o navegador os resolvia a partir da página aberta (home em _src-site/,
     shop/produto/carrinho na raiz) — por isso funcionavam só em alguns lugares.
     Aqui tudo é resolvido a partir do local real do main.js. */
  var SCRIPT_URL = (function () {
    var s = document.currentScript;
    if (!s) {
      var all = document.getElementsByTagName("script");
      for (var i = 0; i < all.length; i++) {
        if (/main\.js(\?|$)/.test(all[i].src)) s = all[i];
      }
    }
    return (s && s.src) || window.location.href;
  })();
  function fromAssets(path) {
    try { return new URL(path, SCRIPT_URL).href; } catch (e) { return path; }
  }
  function page(name) { return fromAssets("../" + name); }
  function fixImg(src) {
    if (!src || /^(https?:|data:|blob:|\/)/i.test(src)) return src;
    return fromAssets(src);
  }
  var PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#121212"/>' +
    '<text x="200" y="215" font-family="Arial,sans-serif" font-size="64" font-weight="700" fill="#8B0000" text-anchor="middle">47</text></svg>'
  );
  (Q.products || []).forEach(function (p) {
    p.images = (p.images && p.images.length ? p.images : [PLACEHOLDER]).map(fixImg);
  });

  /* ---------- helpers ---------- */
  function el(sel, root) { return (root || document).querySelector(sel); }
  function els(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function money(v) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  function findProduct(id) {
    return (Q.products || []).filter(function (p) { return p.id === id; })[0];
  }
  function waLink(text) {
    return "https://wa.me/" + brand.whatsapp + "?text=" + encodeURIComponent(text || "Olá! Vim pelo site da Quarenta&sete e quero saber mais sobre as peças.");
  }

  /* ---------- toast ---------- */
  var toastEl;
  var toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2600);
  }

  /* ---------- cart ---------- */
  var memoryCart = null; // reserva caso o localStorage esteja bloqueado
  function readCart() {
    var raw;
    try { raw = JSON.parse(localStorage.getItem(CART_KEY)); }
    catch (e) { raw = memoryCart; }
    if (!Array.isArray(raw)) return [];
    // descarta itens inválidos ou de produtos que não existem mais
    return raw.filter(function (i) {
      return i && findProduct(i.id) && findProduct(i.id).sizes.includes(i.size);
    }).map(function (i) {
      return { id: i.id, size: i.size, qty: Math.min(99, Math.max(1, parseInt(i.qty, 10) || 1)) };
    });
  }
  function writeCart(items) {
    memoryCart = items;
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) {}
    paintCount();
  }
  function addToCart(id, size, qty) {
    var p = findProduct(id);
    if (!p) return false;
    if (!size) { toast("Escolha um tamanho"); return false; }
    var items = readCart();
    var match = items.filter(function (i) { return i.id === id && i.size === size; })[0];
    if (match) match.qty = Math.min(99, match.qty + (qty || 1));
    else items.push({ id: id, size: size, qty: Math.min(99, qty || 1) });
    writeCart(items);
    toast(p.name + " (" + size + ") no carrinho");
    return true;
  }
  function orderText() {
    var lines = readCart().map(function (i) {
      var p = findProduct(i.id);
      return "• " + i.qty + "x " + p.name + " (tam. " + i.size + ") — " + money(p.price * i.qty);
    });
    return "Olá! Quero finalizar meu pedido na Quarenta&sete:\n" + lines.join("\n") +
      "\nSubtotal: " + money(cartTotals().subtotal);
  }
  function cartTotals() {
    return readCart().reduce(function (acc, i) {
      var p = findProduct(i.id);
      if (p) { acc.count += i.qty; acc.subtotal += p.price * i.qty; }
      return acc;
    }, { count: 0, subtotal: 0 });
  }
  function paintCount() {
    var n = cartTotals().count;
    els("[data-cart-count]").forEach(function (node) { node.textContent = n; });
  }

  /* ---------- shared UI ---------- */
  var burgerBound = false;
  function initHeader() {
    var burger = el("[data-burger]");
    var nav = el("[data-nav]");
    if (burger && nav && !burgerBound) {
      burgerBound = true;
      burger.addEventListener("click", function () {
        nav.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", nav.classList.contains("is-open"));
      });
      els("a", nav).forEach(function (a) {
        a.addEventListener("click", function () { nav.classList.remove("is-open"); });
      });
    }
    // o ícone do carrinho precisa sempre abrir a página certa
    els('.icon-btn[href$="carrinho.html"]').forEach(function (a) { a.href = page("carrinho.html"); });
    bindContactLinks();
  }
  // links dinâmicos de contato (pode ser chamada de novo após renderizar HTML novo)
  function bindContactLinks() {
    els("[data-wa]").forEach(function (a) { a.href = waLink(a.getAttribute("data-wa-text")); });
    els("[data-ig]").forEach(function (a) { a.href = brand.instagramUrl; });
    els("[data-ig-handle]").forEach(function (n) { n.textContent = "@" + brand.instagram; });
    els("[data-wa-label]").forEach(function (n) { n.textContent = brand.whatsappLabel; });
    els("[data-email]").forEach(function (a) {
      a.href = "mailto:" + brand.email;
      if (a.hasAttribute("data-email-label")) a.textContent = brand.email;
    });
  }

  function initReveal() {
    var nodes = els(".reveal");
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -40px" });
    nodes.forEach(function (n, i) {
      n.style.transitionDelay = (i % 4) * 70 + "ms";
      io.observe(n);
    });
  }

  /* ---------- product card ---------- */
  function cardHTML(p) {
    return (
      '<article class="card reveal">' +
      '<a class="card__media" href="' + page("produto.html") + '?id=' + p.id + '" aria-label="Ver ' + p.name + '">' +
      (p.tag ? '<span class="tag">' + p.tag + "</span>" : "") +
      '<img src="' + p.images[0] + '" alt="' + p.name + ' — Quarenta&sete streetwear" loading="lazy" width="600" height="600">' +
      "</a>" +
      '<div class="card__body">' +
      '<h3 class="card__name"><a href="' + page("produto.html") + '?id=' + p.id + '">' + p.name + "</a></h3>" +
      '<p class="card__desc">' + p.short + "</p>" +
      '<p class="card__price">' + money(p.price) + "</p>" +
      '<div class="sizes" data-sizes>' +
      p.sizes.map(function (s, i) {
        return '<button class="size' + (i === 0 ? " is-active" : "") + '" type="button" data-size="' + s + '">' + s + "</button>";
      }).join("") +
      "</div>" +
      '<div class="card__actions">' +
      '<button class="btn btn--sm" type="button" data-add="' + p.id + '">Adicionar ao carrinho</button>' +
      '<button class="btn btn--sm btn--ghost" type="button" data-buy="' + p.id + '">Comprar</button>' +
      "</div></div></article>"
    );
  }

  function bindCardActions(root) {
    els("[data-sizes]", root).forEach(function (group) {
      group.addEventListener("click", function (ev) {
        var b = ev.target.closest(".size");
        if (!b) return;
        els(".size", group).forEach(function (s) { s.classList.remove("is-active"); });
        b.classList.add("is-active");
      });
    });
    function selectedSize(scope) {
      var active = el(".size.is-active", scope);
      return active ? active.getAttribute("data-size") : null;
    }
    els("[data-add]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        addToCart(b.getAttribute("data-add"), selectedSize(b.closest(".card")), 1);
      });
    });
    els("[data-buy]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        if (addToCart(b.getAttribute("data-buy"), selectedSize(b.closest(".card")), 1)) {
          window.location.href = page("carrinho.html");
        }
      });
    });
  }

  /* ---------- home ---------- */
  function initHome() {
    var featured = el("[data-featured]");
    if (featured) {
      featured.innerHTML = (Q.products || []).slice(0, 4).map(cardHTML).join("");
      bindCardActions(featured);
    }
    var steps = el("[data-steps]");
    if (steps) {
      steps.innerHTML = (Q.process || []).map(function (s) {
        return (
          '<article class="step reveal">' +
          '<svg class="step__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="' + s.icon + '" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '<span class="step__n">' + s.n + "</span>" +
          "<h3>" + s.title + "</h3>" +
          '<span class="sub">' + s.sub + "</span>" +
          "<p>" + s.text + "</p>" +
          "</article>"
        );
      }).join("");
    }
    var ig = el("[data-ig-grid]");
    if (ig) {
      // Placeholder pronto para receber posts da API do Instagram (Graph API):
      // basta preencher window.Q47.igPosts = [{image, permalink, caption}] e este bloco usa os dados.
      var posts = window.Q47.igPosts && window.Q47.igPosts.length
        ? window.Q47.igPosts
        : (Q.products || []).map(function (p) { return { image: p.images[0], permalink: brand.instagramUrl, caption: p.name }; });
      ig.innerHTML = posts.slice(0, 6).map(function (post) {
        return (
          '<a class="ig-item" href="' + post.permalink + '" target="_blank" rel="noopener">' +
          '<img src="' + fixImg(post.image) + '" alt="' + post.caption + ' — post da Quarenta&sete no Instagram" loading="lazy" width="400" height="400"></a>'
        );
      }).join("");
    }
  }

  /* ---------- shop ---------- */
  function initShop() {
    var grid = el("[data-shop-grid]");
    if (!grid) return;
    var filters = el("[data-filters]");
    var params = new URLSearchParams(window.location.search);
    var current = params.get("cat") || "todos";

    if (filters) {
      filters.innerHTML = (Q.categories || []).map(function (c) {
        return '<button class="filter' + (c.id === current ? " is-active" : "") + '" type="button" data-cat="' + c.id + '">' + c.label + "</button>";
      }).join("");
      filters.addEventListener("click", function (ev) {
        var b = ev.target.closest(".filter");
        if (!b) return;
        current = b.getAttribute("data-cat");
        els(".filter", filters).forEach(function (f) { f.classList.remove("is-active"); });
        b.classList.add("is-active");
        try { history.replaceState(null, "", window.location.pathname + (current === "todos" ? "" : "?cat=" + current)); } catch (e) {}
        render();
      });
    }

    function render() {
      var list = (Q.products || []).filter(function (p) {
        return current === "todos" || p.category === current || (current === "novidades" && p.tag);
      });
      grid.innerHTML = list.length
        ? list.map(cardHTML).join("")
        : '<p class="lead">Nenhuma peça nesta categoria ainda. Novos drops em breve.</p>';
      bindCardActions(grid);
      els(".reveal", grid).forEach(function (n) { n.classList.add("is-in"); });
    }
    render();
  }

  /* ---------- product detail ---------- */
  function initPDP() {
    var root = el("[data-pdp]");
    if (!root) return;
    var id = new URLSearchParams(window.location.search).get("id");
    var p = id ? findProduct(id) : (Q.products || [])[0];
    if (!p) { root.innerHTML='<div class="empty"><h2 class="display">Peça indisponível</h2><p>Esta peça não está mais no catálogo.</p><a class="btn" href="'+page('shop.html')+'">Ver coleção</a></div>'; return; }

    document.title = p.name + " | Quarenta&sete";
    var desc = el('meta[name="description"]');
    if (desc) desc.setAttribute("content", p.short + " " + money(p.price) + " — Quarenta&sete streetwear.");

    var crumb = el("[data-crumb]");
    if (crumb) crumb.textContent = p.name;

    root.innerHTML =
      '<div class="gallery">' +
      '<div class="gallery__main"><img id="pdp-main" src="' + p.images[0] + '" alt="' + p.name + ' — Quarenta&sete" width="900" height="900"></div>' +
      '<div class="gallery__thumbs" data-thumbs>' +
      p.images.map(function (src, i) {
        return '<button class="thumb' + (i === 0 ? " is-active" : "") + '" type="button" data-src="' + src + '"><img src="' + src + '" alt="' + p.name + " — foto " + (i + 1) + '" loading="lazy" width="200" height="200"></button>';
      }).join("") +
      "</div></div>" +
      '<div class="pdp__info">' +
      '<span class="eyebrow">' + p.category + "</span>" +
      '<h1 class="display" style="font-size:clamp(1.9rem,4.4vw,3rem)">' + p.name + "</h1>" +
      '<p class="price-lg">' + money(p.price) + "</p>" +
      '<p class="lead">' + p.description + "</p>" +
      "<div><p class=\"field-label\">Tamanhos</p><div class=\"sizes\" data-sizes>" +
      p.sizes.map(function (s, i) {
        return '<button class="size' + (i === 0 ? " is-active" : "") + '" type="button" data-size="' + s + '">' + s + "</button>";
      }).join("") +
      "</div></div>" +
      '<div><p class="field-label">Quantidade</p><div class="qty">' +
      '<button type="button" data-step="-1" aria-label="Diminuir">−</button>' +
      '<input id="pdp-qty" type="number" min="1" value="1" aria-label="Quantidade">' +
      '<button type="button" data-step="1" aria-label="Aumentar">+</button>' +
      "</div></div>" +
      '<div style="display:grid;gap:10px">' +
      '<button class="btn btn--block" type="button" data-pdp-add>Adicionar ao carrinho</button>' +
      '<button class="btn btn--block btn--light" type="button" data-pdp-buy>Comprar agora</button>' +
      '<a class="btn btn--block btn--ghost" data-wa data-wa-text="Olá! Quero saber mais sobre a peça ' + p.name + '." target="_blank" rel="noopener">Tirar dúvida no WhatsApp</a>' +
      "</div>" +
      '<details class="guide"><summary>Guia de tamanhos</summary><table class="table"><thead><tr><th>Tam.</th><th>Tórax</th><th>Comprimento</th></tr></thead><tbody>' +
      (Q.sizeGuide || []).map(function (g) { return "<tr><td>" + g.size + "</td><td>" + g.chest + "</td><td>" + g.length + "</td></tr>"; }).join("") +
      "</tbody></table><p class=\"card__desc\" style=\"margin-top:12px\">Modelagem oversized: se preferir caimento mais justo, escolha um tamanho abaixo.</p></details>" +
      "</div>";

    var main = el("#pdp-main");
    el("[data-thumbs]", root).addEventListener("click", function (ev) {
      var b = ev.target.closest(".thumb");
      if (!b) return;
      els(".thumb", root).forEach(function (t) { t.classList.remove("is-active"); });
      b.classList.add("is-active");
      main.src = b.getAttribute("data-src");
    });

    els(".size", root).forEach(function (b) {
      b.addEventListener("click", function () {
        els(".size", root).forEach(function (s) { s.classList.remove("is-active"); });
        b.classList.add("is-active");
      });
    });

    var qtyInput = el("#pdp-qty");
    els("[data-step]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        var next = (parseInt(qtyInput.value, 10) || 1) + parseInt(b.getAttribute("data-step"), 10);
        qtyInput.value = Math.max(1, next);
      });
    });

    function size() { var a = el(".size.is-active", root); return a ? a.getAttribute("data-size") : null; }
    el("[data-pdp-add]", root).addEventListener("click", function () {
      addToCart(p.id, size(), Math.max(1, parseInt(qtyInput.value, 10) || 1));
    });
    el("[data-pdp-buy]", root).addEventListener("click", function () {
      if (addToCart(p.id, size(), Math.max(1, parseInt(qtyInput.value, 10) || 1))) {
        window.location.href = page("carrinho.html");
      }
    });

    var related = el("[data-related]");
    if (related) {
      related.innerHTML = (Q.products || [])
        .filter(function (x) { return x.id !== p.id; })
        .sort(function (a, b) { return (b.category === p.category) - (a.category === p.category); })
        .slice(0, 4)
        .map(cardHTML)
        .join("");
      bindCardActions(related);
      els(".reveal", related).forEach(function (n) { n.classList.add("is-in"); });
    }

    bindContactLinks();
  }

  /* ---------- cart page ---------- */
  function initCartPage() {
    var root = el("[data-cart-root]");
    if (!root) return;

    function render() {
      var items = readCart();
      if (!items.length) {
        root.innerHTML =
          '<div class="empty"><h2 class="display">Seu carrinho está vazio</h2>' +
          '<p class="lead" style="margin:14px auto 22px">Escolha suas peças e comece a construir seu legado.</p>' +
          '<a class="btn" href="' + page("shop.html") + '">Conheça a coleção</a></div>';
        return;
      }
      var totals = cartTotals();
      root.innerHTML =
        '<div class="cart-layout"><div>' +
        items.map(function (i, idx) {
          var p = findProduct(i.id);
          if (!p) return "";
          return (
            '<div class="cart-row">' +
            '<img src="' + p.images[0] + '" alt="' + p.name + '" width="96" height="96">' +
            "<div>" +
            '<h3 class="card__name">' + p.name + "</h3>" +
            '<p class="card__desc">Tamanho: <strong>' + i.size + "</strong> · " + money(p.price) + " un.</p>" +
            '<div style="display:flex;align-items:center;gap:14px;margin-top:10px;flex-wrap:wrap">' +
            '<div class="qty"><button type="button" data-dec="' + idx + '" aria-label="Diminuir">−</button>' +
            '<input type="number" min="1" value="' + i.qty + '" data-qty="' + idx + '" aria-label="Quantidade">' +
            '<button type="button" data-inc="' + idx + '" aria-label="Aumentar">+</button></div>' +
            '<button class="link-danger" type="button" data-remove="' + idx + '">Remover</button>' +
            "</div></div>" +
            '<p class="card__price">' + money(p.price * i.qty) + "</p>" +
            "</div>"
          );
        }).join("") +
        "</div>" +
        '<aside class="cart-sum">' +
        '<h2 class="display" style="font-size:1.4rem">Resumo</h2>' +
        '<div class="sum-line"><span>Subtotal (' + totals.count + " itens)</span><span>" + money(totals.subtotal) + "</span></div>" +
        '<div class="sum-line"><span>Frete</span><span>A combinar com a loja</span></div>' +
        '<div class="sum-total"><span class="eyebrow">Subtotal</span><span class="price-lg">' + money(totals.subtotal) + "</span></div>" +
        '<button class="btn btn--block" type="button" data-checkout>Finalizar pedido</button>' +
        '<a class="btn btn--block btn--ghost" data-wa data-wa-text="Olá! Quero finalizar meu pedido na Quarenta&sete." target="_blank" rel="noopener">Fechar pelo WhatsApp</a>' +
        '<p class="card__desc">Registre o pedido e combine entrega e pagamento com a loja. Nenhuma cobrança automática.</p>' +
        "</aside></div>";

      els("[data-remove]", root).forEach(function (b) {
        b.addEventListener("click", function () {
          var items = readCart();
          items.splice(parseInt(b.getAttribute("data-remove"), 10), 1);
          writeCart(items); render();
        });
      });
      function change(idx, delta, absolute) {
        var items = readCart();
        if (!items[idx]) return;
        items[idx].qty = Math.min(99, Math.max(1, absolute != null ? absolute : items[idx].qty + delta));
        writeCart(items); render();
      }
      els("[data-inc]", root).forEach(function (b) {
        b.addEventListener("click", function () { change(parseInt(b.getAttribute("data-inc"), 10), 1); });
      });
      els("[data-dec]", root).forEach(function (b) {
        b.addEventListener("click", function () { change(parseInt(b.getAttribute("data-dec"), 10), -1); });
      });
      els("[data-qty]", root).forEach(function (input) {
        input.addEventListener("change", function () {
          change(parseInt(input.getAttribute("data-qty"), 10), 0, parseInt(input.value, 10) || 1);
        });
      });
      var checkout = el("[data-checkout]", root);
      if (checkout) checkout.addEventListener("click", function () {
        window.location.href = page("checkout.html");
      });
      var wa = el("[data-wa]", root);
      if (wa) wa.setAttribute("data-wa-text", orderText()); // WhatsApp já leva os itens
      bindContactLinks();
    }
    render();
    window.addEventListener("pageshow", function (e) { if (e.persisted) render(); });
    window.addEventListener("storage", function (e) { if (e.key === CART_KEY) render(); });
  }

  /* ---------- contact form ---------- */
  function initForm() {
    var form = el("[data-contact-form]");
    if (!form) return;
    form.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      if(!form.reportValidity())return;
      var data=new FormData(form),button=form.querySelector('button[type="submit"]');if(button)button.disabled=true;
      try{await EcoAPI.call('contact','POST',{name:data.get('nome'),email:data.get('email'),phone:data.get('telefone'),message:data.get('mensagem')});toast('Mensagem enviada à loja. Obrigado pelo contato!');form.reset();}catch(e){toast(e.message);}finally{if(button)button.disabled=false;}
    });
  }

  /* ---------- imagens quebradas ----------
     1ª falha: tenta o caminho certo a partir da pasta assets/ (serve p/ logo, hero etc.)
     2ª falha: em fotos de produto, mostra um placeholder em vez do ícone quebrado. */
  var CONTENT_IMG = ".card__media, .gallery__main, .thumb, .ig-item, .cart-row";
  function handleBroken(img) {
    if (!img || img.tagName !== "IMG" || img.src === PLACEHOLDER) return;
    var m = (img.getAttribute("src") || "").match(/img\/([^\/?#]+)$/);
    if (m && !img.getAttribute("data-retry")) {
      img.setAttribute("data-retry", "1");
      var fixed = fromAssets("../img/" + m[1]);
      if (fixed !== img.src) { img.src = fixed; return; }
    }
    if (img.closest(CONTENT_IMG)) img.src = PLACEHOLDER;
  }
  document.addEventListener("error", function (ev) { handleBroken(ev.target); }, true);
  window.addEventListener("load", function () {
    els("img").forEach(function (img) {
      if (img.getAttribute("loading") !== "lazy" && img.complete && img.naturalWidth === 0) handleBroken(img);
    });
  });
  window.addEventListener("pageshow", paintCount);

  /* ---------- link de conta no menu (Entrar / Painel / Sair) ---------- */
  function initAccountLink() {
    var nav = el("[data-nav]");
    if (!nav || !window.fetch || window.location.protocol === "file:") return;
    EcoAPI.call("me").then(function (d) {
      var a = document.createElement("a");
      var u = d && d.user;
      if (!u) { a.href = page("login.html"); a.textContent = "Entrar"; }
      else if (u.role === "admin") { a.href = page("admin.php"); a.textContent = "Painel"; }
      else {
        a.href = page("conta.html"); a.textContent = "Minha conta";
        a.addEventListener("click", function (ev) {
          
        });
      }
      nav.appendChild(a);
    }).catch(function () {});
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initHeader();
    initAccountLink();
    initHome();
    initShop();
    initPDP();
    initCartPage();
    initForm();
    initReveal();
    paintCount();
    var year = el("[data-year]");
    if (year) year.textContent = new Date().getFullYear();
  });
})();
