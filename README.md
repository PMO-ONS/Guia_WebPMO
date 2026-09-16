# Guia do Usuário do WebPMO

Versão web (interativa) do **Guia do Usuário do WebPMO** — Sistema de Gestão de Informações do PMO para Web, do **Operador Nacional do Sistema Elétrico (ONS)**.

Nesta arquitetura, **todo o texto do guia fica no arquivo [`conteudo.md`](conteudo.md)**, em Markdown. O `index.html` é apenas a "casca" (layout e recursos visuais) e carrega esse Markdown automaticamente. Para atualizar o guia, **basta editar o `conteudo.md`** — não é preciso mexer em HTML.

## Estrutura do projeto

```
guia-webpmo/
├── index.html              ← casca do site (layout, cabeçalho, rodapé)
├── conteudo.md             ← ✏️ TODO O TEXTO DO GUIA — edite aqui
├── assets/
│   ├── css/style.css       ← aparência (cores, tipografia, layout)
│   └── js/app.js           ← carrega o .md e ativa os recursos interativos
├── images/                 ← figuras do guia (image2.png, image6.svg, …)
├── extrair_imagens.py      ← utilitário: extrai as imagens do .docx original
├── .nojekyll               ← necessário no GitHub Pages
├── README.md
└── LICENSE
```

## Recursos

- 📌 Menu lateral com índice gerado **automaticamente** a partir dos títulos do Markdown
- 🔍 Imagens abrem ampliadas em pop-up (clique para ampliar)
- 💬 Notas de rodapé exibidas em balões ao passar o mouse
- ∑ Fórmulas renderizadas em LaTeX (via MathJax)
- 🔗 Botões de acesso ao WebPMO e de contato com a Equipe do PMO
- 📱 Layout responsivo + versão para impressão

---

## Imagens

A pasta `images/` **já vem completa**, com as 60 figuras do guia e a logo do ONS. Não é necessário nenhum passo adicional para publicar.

Se um dia o documento Word for atualizado e você precisar regerar as figuras, use o utilitário incluído:

```bash
python extrair_imagens.py "Guia do usuário do WebPMO.docx"
```

Ele lê o `conteudo.md`, identifica quais imagens são referenciadas e as extrai do `.docx` com os nomes corretos.

> Um `.docx` é um arquivo ZIP: as imagens ficam em `word/media/` exatamente com os nomes (`image2.png`, `image6.svg`, …) que o `conteudo.md` referencia.

---

## Como publicar no GitHub Pages

### Opção A — Pela interface do GitHub (sem linha de comando)

1. Crie um repositório em <https://github.com/new>. Ex.: `guia-webpmo` (pode ser **público**).
2. Clique em **Add file → Upload files** e arraste **a pasta inteira** do projeto (mantendo `assets/` e `images/`).
3. Clique em **Commit changes**.
4. Vá em **Settings → Pages**.
5. Em **Source**, selecione **Deploy from a branch**.
6. Em **Branch**, escolha **`main`** e a pasta **`/ (root)`** → **Save**.
7. Aguarde ~1 minuto. O endereço aparecerá no topo da tela:
   `https://SEU-USUARIO.github.io/guia-webpmo/`

### Opção B — Pela linha de comando (Git)

```bash
git init
git add .
git commit -m "Publica Guia do Usuário do WebPMO"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/guia-webpmo.git
git push -u origin main
```

Depois ative o Pages conforme os passos 4 a 7 acima.

> **Por que o `.nojekyll` é importante?** Sem ele, o GitHub Pages processa o site com o Jekyll, que **ignora pastas iniciadas com `_`** e pode interferir em arquivos `.md`. O `.nojekyll` (arquivo vazio) garante que tudo seja servido exatamente como está — inclusive o `conteudo.md`, que precisa ser baixado pelo navegador.

---

## 🖥️ Visualizando no seu computador (importante)

**Não abra o `index.html` com dois cliques.** Ao abrir via `file://`, o navegador bloqueia por segurança (política CORS) a leitura do `conteudo.md`, e a página exibirá um aviso de erro.

Para testar localmente, rode um servidor simples na pasta do projeto:

```bash
python -m http.server
```

Depois acesse <http://localhost:8000> no navegador. (No GitHub Pages isso **não** é um problema, pois o site é servido via HTTPS.)

---

## ✏️ Como editar o conteúdo

Abra o `conteudo.md` em qualquer editor de texto. Vale a sintaxe Markdown normal, mais estas convenções:

| O que você quer | Como escrever |
|---|---|
| Capítulo (nível 1) | `## 3. WebPMO` |
| Seção (nível 2) | `### 3.1. Acesso ao sistema` |
| Subseção (nível 3) | `#### 3.3.1. Situação da Coleta` |
| Subtítulo destacado (faixa verde) | `##### Envio do insumo no WebPMO` |
| Figura com legenda | `![Figura 9: Insumo dos volumes iniciais.](images/image21.png)` |
| Nota de rodapé | `texto[^1]` e, no fim do arquivo, `[^1]: Conteúdo da nota.` |
| Fórmula em destaque | bloco cercado por <code>\`\`\`math</code> … <code>\`\`\`</code> |
| Fórmula no meio da frase | `` `$LI_{T} \leq G_{T}$` `` (entre crases **e** cifrões) |
| Negrito / itálico | `**negrito**` / `*itálico*` |
| Link | `[texto](https://exemplo.com)` |

Observações úteis:

- **O índice lateral é automático.** Ao adicionar ou renomear um título, ele aparece sozinho no menu — não há lista para atualizar manualmente.
- **A numeração das figuras é manual**, escrita na própria legenda (ex.: `Figura 12: …`).
- **Por que as fórmulas inline usam crases?** As crases impedem que o Markdown interprete os `_` do LaTeX como itálico. O `app.js` converte `` `$…$` `` em fórmula automaticamente.
- Você pode usar **HTML puro** dentro do `.md` quando precisar de algo específico (os destaques de status coloridos e os blocos de QR Code usam esse recurso).

---

## Atualizando o site

Basta editar o `conteudo.md` e enviar um novo commit. O GitHub Pages republica sozinho em cerca de 1 minuto.

## Domínio personalizado (opcional)

1. Em **Settings → Pages → Custom domain**, informe o domínio (ex.: `guia.webpmo.ons.org.br`) e salve.
2. No DNS, crie um registro **CNAME** apontando o subdomínio para `SEU-USUARIO.github.io`.
3. Após a propagação, marque **Enforce HTTPS**.

## Dependências externas

O site usa três bibliotecas via CDN (exigem internet no momento da visualização):

- **markdown-it** — converte o Markdown em HTML
- **markdown-it-footnote** — suporte às notas de rodapé
- **MathJax** — renderiza as fórmulas em LaTeX

Para funcionamento 100% offline, baixe esses arquivos para `assets/js/` e ajuste os `<script>` do `index.html`.

---

*Operador Nacional do Sistema Elétrico — ONS · Gerência de Programação Mensal (PRM)*
