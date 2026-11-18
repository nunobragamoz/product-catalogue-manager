/**
 * script.js
 * Controlo da interface: renderização da tabela, formulário, edição em linha,
 * remoção, filtros, detalhes via API e importação/exportação de JSON.
 */

/* ============================================================
   INSTÂNCIAS E REFERÊNCIAS AO DOM
   ============================================================ */

const catalogo = new Catalogo();
const api = new LojaAPI();

const formulario = document.getElementById("add-product-form");
const inputNome = document.getElementById("name");
const inputPreco = document.getElementById("price");
const inputDescricao = document.getElementById("description");
const inputCategoria = document.getElementById("category");

const tabela = document.getElementById("product-table-body");
const contador = document.getElementById("contador");
const filtroCategoria = document.getElementById("filtro-categoria");
const campoPesquisa = document.getElementById("pesquisa");
const listaCategorias = document.getElementById("lista-categorias");

const btnExportar = document.getElementById("btn-exportar");
const btnImportar = document.getElementById("btn-importar");
const btnLimpar = document.getElementById("btn-limpar");
const inputFicheiro = document.getElementById("ficheiro-json");

const modal = document.getElementById("modal-detalhes");
const modalLocal = document.getElementById("modal-local");
const modalApi = document.getElementById("modal-api");
const notificacoes = document.getElementById("notificacoes");

/* ID do produto que está a ser editado diretamente na tabela (null = nenhum). */
let idEmEdicao = null;

/* ============================================================
   UTILITÁRIOS
   ============================================================ */

/* Escapa texto antes de o inserir com innerHTML. */

function escapar(valor) {
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/* Mensagem temporária no canto do ecrã. */

function notificar(mensagem, tipo = "sucesso") {

    const caixa = document.createElement("div");
    caixa.className = `notificacao notificacao-${tipo}`;
    caixa.textContent = mensagem;
    notificacoes.appendChild(caixa);

    setTimeout(() => {
        caixa.classList.add("a-sair");
        caixa.addEventListener("transitionend", () => caixa.remove(), { once: true });
    }, 3000);
}

/* Limpa as mensagens de erro do formulário. */

function limparErros() {
    document.querySelectorAll("#add-product-form .erro").forEach(elemento => {
        elemento.textContent = "";
    });
    document.querySelectorAll("#add-product-form input").forEach(elemento => {
        elemento.classList.remove("invalido");
    });
}

/* Mostra as mensagens devolvidas por Produto.validar(). */

function mostrarErros(erros) {

    const mapa = {
        nome: ["erro-name", inputNome],
        preco: ["erro-price", inputPreco],
        descricao: ["erro-description", inputDescricao],
        categoria: ["erro-category", inputCategoria]
    };

    Object.entries(erros).forEach(([campo, mensagem]) => {
        const [idErro, input] = mapa[campo];
        document.getElementById(idErro).textContent = mensagem;
        input.classList.add("invalido");
    });
}

/* ============================================================
   RENDERIZAÇÃO DA TABELA
   ============================================================ */

function atualizarTabela() {

    const produtos = catalogo.listar({
        categoria: filtroCategoria.value,
        termo: campoPesquisa.value
    });

    tabela.innerHTML = "";

    if (produtos.length === 0) {
        const vazio = document.createElement("tr");
        const mensagem = catalogo.produtos.length === 0
            ? "Ainda não existem produtos no catálogo."
            : "Nenhum produto corresponde ao filtro aplicado.";
        vazio.innerHTML = `<td colspan="5" class="sem-resultados">${mensagem}</td>`;
        tabela.appendChild(vazio);
    }

    // A numeração (#) é calculada na renderização, por isso é sempre 1..N,
    // mesmo depois de remoções ou com filtros ativos. O id continua a ser
    // o identificador estável usado nas ações (editar/excluir/detalhes).
    produtos.forEach((produto, indice) => {
        const posicao = indice + 1;
        if (produto.id === idEmEdicao) {
            criarLinhasDeEdicao(produto, posicao).forEach(linha => tabela.appendChild(linha));
        } else {
            tabela.appendChild(criarLinha(produto, posicao));
        }
    });

    atualizarContador(produtos.length);
    atualizarCategorias();
}

/* Linha normal (modo leitura). */
function criarLinha(produto, posicao) {

    const linha = document.createElement("tr");

    linha.innerHTML = `
        <td data-titulo="Nº">${posicao}</td>
        <td data-titulo="Nome">${escapar(produto.nome)}</td>
        <td data-titulo="Preço">${produto.precoFormatado}</td>
        <td data-titulo="Categoria"><span class="etiqueta">${escapar(produto.categoria)}</span></td>
        <td data-titulo="Ações" class="celula-acoes">
            <button type="button" class="btn btn-pequeno btn-primario" data-acao="editar" data-id="${produto.id}">Editar</button>
            <button type="button" class="btn btn-pequeno btn-perigo" data-acao="excluir" data-id="${produto.id}">Excluir</button>
            <button type="button" class="btn btn-pequeno btn-neutro" data-acao="detalhes" data-id="${produto.id}">Detalhes</button>
        </td>
    `;

    return linha;
}

/* Linhas em modo de edição: campos editáveis + linha extra para a descrição. */
function criarLinhasDeEdicao(produto, posicao) {

    const linha = document.createElement("tr");
    linha.className = "linha-edicao";

    linha.innerHTML = `
        <td data-titulo="Nº">${posicao}</td>
        <td data-titulo="Nome">
            <input type="text" class="input-tabela" id="editar-nome" value="${escapar(produto.nome)}">
        </td>
        <td data-titulo="Preço">
            <input type="number" class="input-tabela" id="editar-preco" step="0.01" min="0" value="${produto.preco}">
        </td>
        <td data-titulo="Categoria">
            <input type="text" class="input-tabela" id="editar-categoria" list="lista-categorias" value="${escapar(produto.categoria)}">
        </td>
        <td data-titulo="Ações" class="celula-acoes">
            <button type="button" class="btn btn-pequeno btn-sucesso" data-acao="guardar" data-id="${produto.id}">Guardar</button>
            <button type="button" class="btn btn-pequeno btn-neutro" data-acao="cancelar" data-id="${produto.id}">Cancelar</button>
        </td>
    `;

    const linhaDescricao = document.createElement("tr");
    linhaDescricao.className = "linha-edicao linha-descricao";

    linhaDescricao.innerHTML = `
        <td colspan="5">
            <label for="editar-descricao">Descrição</label>
            <input type="text" class="input-tabela" id="editar-descricao" value="${escapar(produto.descricao)}">
            <small class="erro" id="erro-edicao"></small>
        </td>
    `;

    return [linha, linhaDescricao];
}

function atualizarContador(visiveis) {
    const total = catalogo.produtos.length;
    contador.textContent = visiveis === total
        ? `${total} ${total === 1 ? "produto" : "produtos"}`
        : `${visiveis} de ${total} produtos`;
}

/* Preenche o filtro de categorias e a datalist do formulário. */
function atualizarCategorias() {

    const categorias = catalogo.categorias();
    const selecionada = filtroCategoria.value;

    filtroCategoria.innerHTML = `<option value="">Todas as categorias</option>`;
    listaCategorias.innerHTML = "";

    categorias.forEach(categoria => {
        const opcao = document.createElement("option");
        opcao.value = categoria;
        opcao.textContent = categoria;
        filtroCategoria.appendChild(opcao);

        const sugestao = document.createElement("option");
        sugestao.value = categoria;
        listaCategorias.appendChild(sugestao);
    });

    // Mantém o filtro ativo se a categoria ainda existir.
    filtroCategoria.value = categorias.includes(selecionada) ? selecionada : "";
}

/* ============================================================
   ADICIONAR PRODUTO
   ============================================================ */

formulario.addEventListener("submit", evento => {

    evento.preventDefault();
    limparErros();

    const dados = {
        nome: inputNome.value.trim(),
        preco: inputPreco.value === "" ? "" : parseFloat(inputPreco.value),
        descricao: inputDescricao.value.trim(),
        categoria: inputCategoria.value.trim()
    };

    const erros = Produto.validar(dados);

    if (Object.keys(erros).length > 0) {
        mostrarErros(erros);
        notificar("Corrija os campos assinalados.", "erro");
        return;
    }

    const produto = new Produto(
        catalogo.proximoId(),
        dados.nome,
        Number(dados.preco.toFixed(2)),
        dados.descricao,
        dados.categoria
    );

    catalogo.adicionarProduto(produto);
    atualizarTabela();
    formulario.reset();
    inputNome.focus();

    notificar(`Produto "${produto.nome}" adicionado.`);
});

formulario.addEventListener("reset", () => limparErros());

/* ============================================================
   AÇÕES DA TABELA (delegação de eventos)
   ============================================================ */

tabela.addEventListener("click", evento => {

    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const id = Number(botao.dataset.id);

    switch (botao.dataset.acao) {
        case "editar": iniciarEdicao(id); break;
        case "guardar": guardarEdicao(id); break;
        case "cancelar": cancelarEdicao(); break;
        case "excluir": excluirProduto(id); break;
        case "detalhes": buscarDetalhes(id); break;
    }
});

/* Enter guarda, Escape cancela a edição em linha. */
tabela.addEventListener("keydown", evento => {

    if (idEmEdicao === null || !evento.target.classList.contains("input-tabela")) return;

    if (evento.key === "Enter") {
        evento.preventDefault();
        guardarEdicao(idEmEdicao);
    } else if (evento.key === "Escape") {
        cancelarEdicao();
    }
});

function iniciarEdicao(id) {
    idEmEdicao = id;
    atualizarTabela();
    const campo = document.getElementById("editar-nome");
    if (campo) campo.focus();
}

function cancelarEdicao() {
    idEmEdicao = null;
    atualizarTabela();
}

function guardarEdicao(id) {

    const nome = document.getElementById("editar-nome").value.trim();
    const precoTexto = document.getElementById("editar-preco").value;
    const categoria = document.getElementById("editar-categoria").value.trim();
    const descricao = document.getElementById("editar-descricao").value.trim();
    const zonaErro = document.getElementById("erro-edicao");

    const erros = Produto.validar({
        nome,
        preco: precoTexto === "" ? "" : parseFloat(precoTexto),
        descricao,
        categoria
    });

    if (Object.keys(erros).length > 0) {
        zonaErro.textContent = Object.values(erros).join(" ");
        return;
    }

    catalogo.editarProduto(id, {
        nome,
        preco: Number(parseFloat(precoTexto).toFixed(2)),
        descricao,
        categoria
    });

    idEmEdicao = null;
    atualizarTabela();
    notificar(`Produto "${nome}" atualizado.`);
}

/* ============================================================
   REMOVER PRODUTO
   ============================================================ */

function excluirProduto(id) {

    const produto = catalogo.obterProduto(id);
    if (!produto) return;

    if (!confirm(`Excluir o produto "${produto.nome}"?`)) return;

    catalogo.removerProduto(id);
    if (idEmEdicao === id) idEmEdicao = null;

    atualizarTabela();
    notificar(`Produto "${produto.nome}" removido.`, "aviso");
}

/* ============================================================
   DETALHES: dados locais + informação obtida por AJAX da API externa
   ============================================================ */

async function buscarDetalhes(id) {

    const produto = catalogo.obterProduto(id);
    if (!produto) return;

    modalLocal.innerHTML = `
        <dl class="lista-dados">
            <div><dt>ID</dt><dd>${produto.id}</dd></div>
            <div><dt>Nome</dt><dd>${escapar(produto.nome)}</dd></div>
            <div><dt>Preço</dt><dd>${produto.precoFormatado}</dd></div>
            <div><dt>Categoria</dt><dd>${escapar(produto.categoria)}</dd></div>
            <div><dt>Descrição</dt><dd>${escapar(produto.descricao)}</dd></div>
        </dl>
    `;

    modalApi.innerHTML = `<p class="a-carregar">A obter informação da API...</p>`;
    abrirModal();

    try {
        const externo = await api.produtoSemelhante(produto);

        const avaliacao = externo.rating
            ? `${externo.rating.rate} / 5 (${externo.rating.count} avaliações)`
            : "Sem avaliações";

        modalApi.innerHTML = `
            <div class="cartao-api">
                <img src="${escapar(externo.image)}" alt="${escapar(externo.title)}" loading="lazy">
                <div>
                    <h5>${escapar(externo.title)}</h5>
                    <p class="etiqueta">${escapar(externo.category)}</p>
                    <p><strong>Preço de referência:</strong> ${Number(externo.price).toFixed(2)} USD</p>
                    <p><strong>Avaliação:</strong> ${escapar(avaliacao)}</p>
                    <p class="descricao-api">${escapar(externo.description)}</p>
                </div>
            </div>
            <p class="nota-api">${externo.aproximado
                ? "A API não tem um artigo equivalente: mostra-se um produto de referência da mesma área."
                : "Artigo mais semelhante encontrado na Fake Store API."}</p>
        `;

    } catch (erro) {
        console.error("Erro ao buscar API", erro);
        modalApi.innerHTML = `
            <p class="mensagem-erro">
                Não foi possível obter informação da API externa.<br>
                <small>${escapar(erro.message)}</small>
            </p>
        `;
    }
}

function abrirModal() {
    modal.classList.remove("oculto");
    document.body.classList.add("sem-scroll");
}

function fecharModal() {
    modal.classList.add("oculto");
    document.body.classList.remove("sem-scroll");
}

modal.addEventListener("click", evento => {
    if (evento.target.closest("[data-fechar-modal]")) fecharModal();
});

document.addEventListener("keydown", evento => {
    if (evento.key === "Escape" && !modal.classList.contains("oculto")) fecharModal();
});

/* ============================================================
   FILTROS
   ============================================================ */

filtroCategoria.addEventListener("change", () => {
    idEmEdicao = null;
    atualizarTabela();
});

campoPesquisa.addEventListener("input", () => {
    idEmEdicao = null;
    atualizarTabela();
});

/* ============================================================
   FICHEIROS JSON: exportar, importar e limpar
   ============================================================ */

btnExportar.addEventListener("click", () => {

    if (catalogo.produtos.length === 0) {
        notificar("Não há produtos para exportar.", "aviso");
        return;
    }

    const ficheiro = new Blob([catalogo.exportar()], { type: "application/json" });
    const url = URL.createObjectURL(ficheiro);

    const ligacao = document.createElement("a");
    ligacao.href = url;
    ligacao.download = "catalogo.json";
    ligacao.click();

    URL.revokeObjectURL(url);
    notificar("Catálogo exportado para catalogo.json.");
});

btnImportar.addEventListener("click", () => inputFicheiro.click());

inputFicheiro.addEventListener("change", () => {

    const ficheiro = inputFicheiro.files[0];
    if (!ficheiro) return;

    const leitor = new FileReader();

    leitor.onload = () => {
        try {
            const total = catalogo.importar(leitor.result);
            idEmEdicao = null;
            atualizarTabela();
            notificar(`${total} produtos importados.`);
        } catch (erro) {
            notificar(`Ficheiro inválido: ${erro.message}`, "erro");
        }
    };

    leitor.onerror = () => notificar("Não foi possível ler o ficheiro.", "erro");
    leitor.readAsText(ficheiro);

    inputFicheiro.value = "";   // permite reimportar o mesmo ficheiro
});

btnLimpar.addEventListener("click", () => {

    if (catalogo.produtos.length === 0) return;

    if (!confirm("Remover todos os produtos do catálogo?")) return;

    catalogo.limpar();
    idEmEdicao = null;
    atualizarTabela();
    notificar("Catálogo limpo.", "aviso");
});

/* ============================================================
   ARRANQUE
   ============================================================ */

async function iniciar() {

    // Na primeira utilização (localStorage vazio) carrega o JSON de exemplo por AJAX.
    
    if (catalogo.produtos.length === 0 && localStorage.getItem(Catalogo.CHAVE) === null) {
        try {
            const iniciais = await LojaAPI.produtosIniciais();
            catalogo.produtos = iniciais.filter(Produto.eValido).map(Produto.fromJSON);
            catalogo.salvarProdutos();
        } catch (erro) {
            console.error("Não foi possível carregar o catálogo inicial:", erro);
        }
    }

    atualizarTabela();
}

iniciar();
