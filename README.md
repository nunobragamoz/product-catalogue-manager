# Gestão de Catálogo de Produtos

Prática do Módulo 6 — JavaScript Avançado (POO, AJAX, JSON e API).

Sistema de gestão do catálogo de produtos de uma loja virtual: permite registar,
listar, filtrar, editar e excluir produtos, guardar tudo em `localStorage` (JSON)
e obter informação adicional a partir de uma API pública (Fake Store API).

## Estrutura do projeto

```
Loja AJAX-JSON/
├── index.html              Estrutura da página (formulário, tabela, modal)
├── css/
│   └── style.css           Estilos (layout, tabela, modal, notificações, responsivo)
├── js/
│   ├── produto.js          Classe Produto (POO) + validações
│   ├── catalogo.js         Classe Catalogo (CRUD, filtros, localStorage, import/export)
│   ├── api.js              Classe LojaAPI (AJAX: Fake Store API + JSON local)
│   └── script.js           Controlo da interface (DOM e eventos)
├── data/
│   └── index.json          Catálogo inicial de exemplo (carregado por AJAX)
└── README.md
```

## Como executar

Basta abrir o `index.html` no navegador. Para que o carregamento inicial de
`data/index.json` seja feito por AJAX, convém usar um servidor local — por
exemplo a extensão **Live Server** do VS Code, ou:

```bash
python3 -m http.server 8000
# depois abrir http://localhost:8000
```

Sem servidor (protocolo `file://`) o navegador bloqueia a leitura do ficheiro
JSON; nesse caso a aplicação usa automaticamente a cópia embutida dos mesmos
dados (`LojaAPI.SEMENTE`), pelo que continua a funcionar na mesma.

## Funcionalidades

| Requisito | Onde está implementado |
|---|---|
| Registo de produtos (ID automático, nome, preço, descrição, categoria) | `script.js` → evento `submit`; `Catalogo.proximoId()` |
| Listagem em tabela (ID, Nome, Preço, Categoria, Ações) | `script.js` → `atualizarTabela()` / `criarLinha()` |
| Filtro por categoria (+ pesquisa por nome/descrição) | `Catalogo.listar()` e `#filtro-categoria` |
| Edição direta na lista | Botão **Editar** → `criarLinhasDeEdicao()` / `guardarEdicao()` |
| Remoção de produtos | Botão **Excluir** → `Catalogo.removerProduto()` |
| Informação externa por AJAX | Botão **Detalhes** → `LojaAPI.produtoSemelhante()` (Fake Store API) |
| Persistência em JSON | `Catalogo.salvarProdutos()` / `carregarProdutos()` com `localStorage` |
| Validações | `Produto.validar()` (nome obrigatório, preço > 0, descrição e categoria obrigatórias) |

Extras: exportar o catálogo para um ficheiro `catalogo.json`, importar um
ficheiro JSON, limpar o catálogo, notificações de sucesso/erro, atalhos
`Enter` (guardar) e `Esc` (cancelar/fechar) e layout responsivo.

## Notas sobre a API externa

A Fake Store API contém apenas 20 artigos genéricos, pelo que os IDs locais não
correspondem aos IDs da API. Por isso, `LojaAPI.produtoSemelhante()` procura o
artigo mais parecido comparando as palavras do nome, categoria e descrição; se
não houver correspondência, apresenta um artigo de eletrónica como referência e
o modal indica-o explicitamente. Toda a informação (imagem, título, categoria,
preço de referência, avaliação e descrição) é obtida com `fetch` e apresentada
sem recarregar a página. Erros de rede e timeouts são tratados e comunicados ao
utilizador.

## Estrutura do JSON guardado

```json
[
    {
        "id": 1,
        "nome": "Produto A",
        "preco": 19.99,
        "descricao": "Descrição do Produto A",
        "categoria": "Categoria 1"
    }
]
```

## Compatibilidade

Foram usadas apenas funcionalidades padrão do ES6+ (classes e campos estáticos,
`fetch`, `async/await`, `Intl.NumberFormat`, `localStorage`, `FileReader`,
`AbortController`), suportadas por todos os navegadores modernos — Chrome, Edge,
Firefox e Safari em versões atuais. Antes da entrega, convém abrir a página em
pelo menos dois navegadores diferentes e confirmar: carregamento inicial,
adicionar, editar, excluir, filtrar, botão **Detalhes** e persistência após
recarregar (F5).
