/* ==========================================================================
   Guia do Usuário do WebPMO — ONS
   Carrega o conteúdo de "conteudo.md", converte para HTML e ativa os recursos
   interativos: índice lateral, pop-up de imagens, balões de nota de rodapé e
   fórmulas em LaTeX.
   ========================================================================== */
(function () {
  'use strict';

  var MD_FILE = 'conteudo.md';
  var HEADER_OFFSET = 76;

  var contentEl = document.getElementById('conteudo');
  var tocEl = document.getElementById('toc');
  var sb = document.getElementById('sidebar');
  var bd = document.getElementById('backdrop');
  var tt = document.getElementById('toTop');

  /* ---------------- Utilidades ---------------- */

  function slugify(txt) {
    return txt.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // remove acentos
      .replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-').replace(/-+/g, '-');
  }

  function showError(msg, detail) {
    contentEl.innerHTML =
      '<div class="load-error"><h3>Não foi possível carregar o conteúdo</h3>' +
      '<p>' + msg + '</p>' + (detail ? '<p><code>' + detail + '</code></p>' : '') + '</div>';
  }

  /* ---------------- Configuração do Markdown ---------------- */

  var md = window.markdownit({
    html: true,        // permite HTML embutido no .md (callouts, chips de status)
    linkify: true,     // transforma URLs soltas em links
    typographer: false,
    breaks: false
  });

  if (window.markdownitFootnote) {
    md.use(window.markdownitFootnote);
  }

  // Abre links externos em nova aba
  var defaultLinkOpen = md.renderer.rules.link_open ||
    function (tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    var href = tokens[idx].attrGet('href') || '';
    if (/^https?:\/\//i.test(href)) {
      tokens[idx].attrSet('target', '_blank');
      tokens[idx].attrSet('rel', 'noopener noreferrer');
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  // Blocos ```math  ->  \[ ... \]  (MathJax)
  var defaultFence = md.renderer.rules.fence;
  md.renderer.rules.fence = function (tokens, idx, options, env, self) {
    var token = tokens[idx];
    if ((token.info || '').trim().toLowerCase() === 'math') {
      return '<div class="math-display">\\[' + token.content + '\\]</div>\n';
    }
    return defaultFence(tokens, idx, options, env, self);
  };

  // Código inline `$...$`  ->  \( ... \)  (protege o LaTeX do parser Markdown)
  md.renderer.rules.code_inline = function (tokens, idx) {
    var c = tokens[idx].content;
    if (c.length > 1 && c.charAt(0) === '$' && c.charAt(c.length - 1) === '$') {
      return '\\(' + c.slice(1, -1) + '\\)';
    }
    return '<code>' + md.utils.escapeHtml(c) + '</code>';
  };

  /* ---------------- Pós-processamento do HTML ---------------- */

  // Imagens isoladas em parágrafo viram <figure> com legenda (vinda do alt)
  function buildFigures(root) {
    root.querySelectorAll('p > img').forEach(function (img) {
      var p = img.parentElement;
      if (p.children.length !== 1 || p.textContent.trim() !== '') return;

      var alt = img.getAttribute('alt') || '';
      var fig = document.createElement('figure');
      fig.className = 'fig';
      img.classList.add('zoomable');
      fig.appendChild(img);

      if (alt) {
        var cap = document.createElement('figcaption');
        var m = alt.match(/^(Figura\s+[\w.]+\s*[:\-]\s*)([\s\S]*)$/i);
        if (m) {
          var n = document.createElement('span');
          n.className = 'fig-num';
          n.textContent = m[1];
          cap.appendChild(n);
          cap.appendChild(document.createTextNode(m[2]));
        } else {
          cap.textContent = alt;
        }
        fig.appendChild(cap);
      }
      p.replaceWith(fig);
    });

    // Garante que imagens em HTML bruto também abram no lightbox
    root.querySelectorAll('figure.fig img, .callout img').forEach(function (i) {
      i.classList.add('zoomable');
    });
  }

  // Envolve tabelas para permitir rolagem horizontal no celular
  function wrapTables(root) {
    root.querySelectorAll('table').forEach(function (t) {
      if (t.parentElement && t.parentElement.classList.contains('table-wrap')) return;
      var w = document.createElement('div');
      w.className = 'table-wrap';
      t.replaceWith(w);
      w.appendChild(t);
    });
  }

  // Marcador ::qr:caminho.png:: no início de um título -> imagem de QR Code
  function expandQrHeadings(root) {
    root.querySelectorAll('h5').forEach(function (h) {
      var m = h.textContent.match(/^::qr:([^:]+)::\s*([\s\S]*)$/);
      if (!m) return;
      h.textContent = '';
      var img = document.createElement('img');
      img.src = m[1];
      img.alt = '';
      img.className = 'zoomable qr-sm';
      h.appendChild(img);
      h.appendChild(document.createTextNode(' ' + m[2]));
    });
  }

  // Numeração visual dos capítulos ("## 1. Introdução" -> selo "1")
  function decorateH2(root) {
    root.querySelectorAll('h2').forEach(function (h) {
      var txt = h.textContent.trim();
      var m = txt.match(/^(Anexo\s+[IVXLC]+|\d+)\.\s*([\s\S]+)$/i);
      if (!m) return;
      h.textContent = '';
      var badge = document.createElement('span');
      badge.className = 'sec-n';
      badge.textContent = m[1];
      h.appendChild(badge);
      h.appendChild(document.createTextNode(m[2]));
    });
  }

  // Converte as notas do markdown-it-footnote em balões (tooltips)
  function footnotesToTooltips(root) {
    var section = root.querySelector('.footnotes');
    var texts = {};

    if (section) {
      section.querySelectorAll('li[id^="fn"]').forEach(function (li) {
        var clone = li.cloneNode(true);
        clone.querySelectorAll('.footnote-backref').forEach(function (b) { b.remove(); });
        texts[li.id] = clone.innerHTML.replace(/<\/?p[^>]*>/g, ' ').trim();
      });
      section.remove();
    }

    root.querySelectorAll('sup.footnote-ref').forEach(function (sup) {
      var a = sup.querySelector('a');
      if (!a) return;
      var href = (a.getAttribute('href') || '').replace('#', '');
      var num = (a.textContent || '').replace(/[\[\]]/g, '');
      var html = texts[href] || '';

      var s = document.createElement('sup');
      s.className = 'fnref';
      s.setAttribute('tabindex', '0');
      s.textContent = num;

      var tip = document.createElement('span');
      tip.className = 'fn-tip';
      tip.innerHTML = html;
      s.appendChild(tip);

      sup.replaceWith(s);
    });
  }

  /* ---------------- Índice lateral ---------------- */

  function buildTOC(root) {
    var heads = root.querySelectorAll('h2, h3, h4');
    var frag = document.createDocumentFragment();
    var used = {};

    heads.forEach(function (h) {
      var label = h.textContent.trim();
      if (!label) return;

      var base = slugify(label) || 'secao';
      var id = base, i = 2;
      while (used[id]) { id = base + '-' + (i++); }
      used[id] = true;
      h.id = id;

      var a = document.createElement('a');
      a.className = 'toc-item lvl' + (h.tagName === 'H2' ? '1' : h.tagName === 'H3' ? '2' : '3');
      a.href = '#' + id;
      a.textContent = label;
      frag.appendChild(a);
    });

    tocEl.innerHTML = '';
    tocEl.appendChild(frag);
  }

  /* ---------------- Navegação ---------------- */

  function scrollToId(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var top = el.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
    window.scrollTo({ top: top < 0 ? 0 : top, behavior: 'smooth' });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  }

  function wireNavigation() {
    tocEl.addEventListener('click', function (e) {
      var a = e.target.closest('.toc-item');
      if (!a) return;
      e.preventDefault();
      if (window.innerWidth <= 960) { sb.classList.remove('open'); bd.classList.remove('open'); }
      scrollToId(a.getAttribute('href').slice(1));
    });

    document.getElementById('menuBtn').addEventListener('click', function () {
      sb.classList.toggle('open'); bd.classList.toggle('open');
    });
    bd.addEventListener('click', function () {
      sb.classList.remove('open'); bd.classList.remove('open');
    });

    tt.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    });
  }

  /* ---------------- Lightbox ---------------- */

  function wireLightbox() {
    var lb = document.getElementById('lightbox');
    var lbImg = document.getElementById('lbImg');
    var lbCap = document.getElementById('lbCap');

    function close() {
      lb.classList.remove('open');
      document.body.style.overflow = '';
      lbImg.src = '';
    }

    document.addEventListener('click', function (e) {
      var img = e.target.closest('img.zoomable');
      if (img) {
        e.stopPropagation();
        lbImg.src = img.src;
        var fg = img.closest('figure');
        var fc = fg ? fg.querySelector('figcaption') : null;
        lbCap.textContent = fc ? fc.textContent : (img.getAttribute('alt') || '');
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });

    document.getElementById('lbClose').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    lbImg.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---------------- Scroll-spy ---------------- */

  function wireScrollSpy() {
    var secs = [].slice.call(document.querySelectorAll('#conteudo h2[id], #conteudo h3[id], #conteudo h4[id]'));
    var items = [].slice.call(tocEl.querySelectorAll('.toc-item'));
    var map = {};
    items.forEach(function (it) { map[it.getAttribute('href').slice(1)] = it; });
    var last = null;

    function spy() {
      var y = window.scrollY + HEADER_OFFSET + 30, cur = null;
      for (var i = 0; i < secs.length; i++) {
        if (secs[i].offsetTop <= y) cur = secs[i].id;
      }
      if (cur && map[cur] && map[cur] !== last) {
        if (last) last.classList.remove('active');
        map[cur].classList.add('active');
        last = map[cur];
        var it = map[cur], top = it.offsetTop, h = it.offsetHeight;
        // Mantém o item visível dentro da barra lateral, sem mover a página
        if (top < sb.scrollTop || top + h > sb.scrollTop + sb.clientHeight) {
          sb.scrollTop = top - sb.clientHeight / 2 + h / 2;
        }
      }
      tt.classList.toggle('show', window.scrollY > 500);
    }

    window.addEventListener('scroll', spy, { passive: true });
    window.addEventListener('resize', spy);
    spy();
  }

  /* ---------------- Inicialização ---------------- */

  function render(markdown) {
    contentEl.innerHTML = md.render(markdown);

    expandQrHeadings(contentEl);
    buildFigures(contentEl);
    wrapTables(contentEl);
    decorateH2(contentEl);
    footnotesToTooltips(contentEl);

    buildTOC(contentEl);
    wireNavigation();
    wireLightbox();
    wireScrollSpy();

    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([contentEl]).catch(function (e) {
        console.warn('MathJax:', e);
      });
    }

    if (location.hash.length > 1) {
      setTimeout(function () { scrollToId(location.hash.slice(1)); }, 120);
    }
  }

  fetch(MD_FILE, { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ao buscar ' + MD_FILE);
      return r.text();
    })
    .then(render)
    .catch(function (err) {
      if (location.protocol === 'file:') {
        showError(
          'A página foi aberta diretamente do disco (<code>file://</code>). Por segurança, ' +
          'o navegador bloqueia a leitura do arquivo <code>conteudo.md</code> nesse modo.<br><br>' +
          'Publique no GitHub Pages (funciona normalmente) ou rode um servidor local com o comando ' +
          '<code>python -m http.server</code> na pasta do projeto e acesse ' +
          '<code>http://localhost:8000</code>.',
          err.message
        );
      } else {
        showError('Verifique se o arquivo <code>conteudo.md</code> está na mesma pasta do <code>index.html</code>.', err.message);
      }
    });
})();
