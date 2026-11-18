/**
 * catalogo.js
 * Classe que gere a coleção de produtos e a sua persistência em localStorage (JSON).
 */

class Catalogo {

    static CHAVE = "produtos";

    constructor() {
        this.produtos = this.carregarProdutos() || [];
    }

    /* ---------------- CRUD ---------------- */

    adicionarProduto(produto) {
        this.produtos.push(produto);
        this.salvarProdutos();
        return produto;
    }

    removerProduto(id) {
        this.produtos = this.produtos.filter(produto => produto.id !== id);
        this.salvarProdutos();
    }

    editarProduto(id, novosDados) {
        const produto = this.obterProduto(id);
        if (produto) {
            Object.assign(produto, novosDados);
            this.salvarProdutos();
        }
        return produto;
    }

    obterProduto(id) {
        return this.produtos.find(produto => produto.id === id);
    }

    /* ---------------- Consultas ---------------- */

    /* Lista os produtos aplicando filtro de categoria e pesquisa por texto. */
    listar({ categoria = "", termo = "" } = {}) {

        const procura = termo.trim().toLowerCase();

        return this.produtos.filter(produto => {

            const correspondeCategoria = categoria === "" || produto.categoria === categoria;

            const correspondeTermo = procura === ""
                || produto.nome.toLowerCase().includes(procura)
                || produto.descricao.toLowerCase().includes(procura);

            return correspondeCategoria && correspondeTermo;
        });
    }

    /* Categorias únicas, por ordem alfabética. */
    categorias() {
        const unicas = new Set(this.produtos.map(produto => produto.categoria));
        return [...unicas].sort((a, b) => a.localeCompare(b, "pt"));
    }

    /* Próximo ID: maior ID existente + 1 (evita repetições após remoções). */
    proximoId() {
        if (this.produtos.length === 0) return 1;
        return Math.max(...this.produtos.map(produto => produto.id)) + 1;
    }

    limpar() {
        this.produtos = [];
        this.salvarProdutos();
    }

    /* ---------------- Persistência (JSON + localStorage) ---------------- */

    salvarProdutos() {
        try {
            localStorage.setItem(Catalogo.CHAVE, JSON.stringify(this.produtos));
        } catch (erro) {
            console.error("Não foi possível gravar no localStorage:", erro);
        }
    }

    carregarProdutos() {
        try {
            const guardado = localStorage.getItem(Catalogo.CHAVE);
            if (!guardado) return null;

            const dados = JSON.parse(guardado);
            if (!Array.isArray(dados)) return null;

            // Reconstrói as instâncias de Produto (o JSON só guarda objetos simples).
            return dados.filter(Produto.eValido).map(Produto.fromJSON);
        } catch (erro) {
            console.error("Dados inválidos no localStorage:", erro);
            return null;
        }
    }

    /* ---------------- Importação / exportação de ficheiros JSON ---------------- */

    /* Substitui o catálogo pelos produtos de um texto JSON. Devolve o nº de produtos importados. */
    importar(textoJSON) {

        const dados = JSON.parse(textoJSON);

        if (!Array.isArray(dados)) {
            throw new Error("O ficheiro JSON deve conter um array de produtos.");
        }

        const validos = dados.filter(Produto.eValido);

        if (validos.length === 0) {
            throw new Error("O ficheiro não contém produtos válidos.");
        }

        // Normaliza os IDs para garantir que são únicos e sequenciais.
        this.produtos = validos.map((objeto, indice) => Produto.fromJSON({
            ...objeto,
            id: Number.isFinite(Number(objeto.id)) ? Number(objeto.id) : indice + 1
        }));

        this.corrigirIdsRepetidos();
        this.salvarProdutos();

        return this.produtos.length;
    }

    corrigirIdsRepetidos() {
        const vistos = new Set();
        this.produtos.forEach((produto, indice) => {
            if (vistos.has(produto.id)) {
                produto.id = Math.max(0, ...vistos) + 1;
            }
            if (!Number.isFinite(produto.id)) {
                produto.id = indice + 1;
            }
            vistos.add(produto.id);
        });
    }

    exportar() {
        return JSON.stringify(this.produtos, null, 4);
    }
}
