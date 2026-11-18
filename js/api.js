/**
 * api.js
 * Camada AJAX: comunicação com a API externa (Fake Store API) e leitura
 * do ficheiro JSON local usado para semear o catálogo na primeira utilização.
 */

class LojaAPI {

    static BASE_URL = "https://fakestoreapi.com";
    static TIMEOUT = 8000;

    constructor() {
        this.cacheProdutos = null;   // lista completa da API, pedida apenas uma vez
    }

    /* Pedido AJAX genérico com timeout, devolvendo JSON. */
    async pedir(url) {

        const controlador = new AbortController();
        const relogio = setTimeout(() => controlador.abort(), LojaAPI.TIMEOUT);

        try {
            const resposta = await fetch(url, { signal: controlador.signal });

            if (!resposta.ok) {
                throw new Error(`A API respondeu com o estado ${resposta.status}.`);
            }

            return await resposta.json();

        } catch (erro) {
            if (erro.name === "AbortError") {
                throw new Error("A API demorou demasiado tempo a responder.");
            }
            throw erro;

        } finally {
            clearTimeout(relogio);
        }
    }

    /* Lista completa de produtos da API (em cache). */
    async todosOsProdutos() {
        if (!this.cacheProdutos) {
            this.cacheProdutos = await this.pedir(`${LojaAPI.BASE_URL}/products`);
        }
        return this.cacheProdutos;
    }

    async produtoPorId(id) {
        return this.pedir(`${LojaAPI.BASE_URL}/products/${id}`);
    }

    /**
     * Procura na API o produto mais parecido com o produto local.
     * A comparação é feita por palavras comuns entre nome/categoria e title/category.
     */
    async produtoSemelhante(produto) {

        const lista = await this.todosOsProdutos();

        if (!Array.isArray(lista) || lista.length === 0) {
            throw new Error("A API não devolveu produtos.");
        }

        const palavrasLocais = LojaAPI.palavras(`${produto.nome} ${produto.categoria} ${produto.descricao}`);

        let melhor = null;
        let melhorPontuacao = -1;

        lista.forEach(item => {
            const palavrasApi = LojaAPI.palavras(`${item.title} ${item.category}`);
            const pontuacao = [...palavrasLocais].filter(palavra => palavrasApi.has(palavra)).length;

            if (pontuacao > melhorPontuacao) {
                melhorPontuacao = pontuacao;
                melhor = item;
            }
        });

        // Sem palavras em comum: escolhe, pelo ID local, um artigo de eletrónica da API.
        if (melhorPontuacao <= 0) {
            const eletronica = lista.filter(item => String(item.category).includes("electronic"));
            const alternativas = eletronica.length > 0 ? eletronica : lista;
            const indice = (Math.abs(produto.id) - 1) % alternativas.length;
            melhor = alternativas[indice];
            melhor = { ...melhor, aproximado: true };
        }

        return melhor;
    }

    /* Conjunto de palavras significativas (sem acentos, sem palavras curtas). */
    static palavras(texto) {
        const limpo = String(texto)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, " ");

        return new Set(limpo.split(/\s+/).filter(palavra => palavra.length > 2));
    }

    /* Carrega o ficheiro JSON local (data/index.json) usado como catálogo inicial. */
    static async produtosIniciais() {
        try {
            const resposta = await fetch("data/index.json");
            if (!resposta.ok) throw new Error("Ficheiro indisponível.");
            return await resposta.json();
        } catch (erro) {
            // Com o protocolo file:// o browser bloqueia o pedido: usa-se a cópia embutida.
            console.warn("Não foi possível ler data/index.json via AJAX; a usar dados embutidos.", erro);
            return LojaAPI.SEMENTE;
        }
    }

    /* Cópia de segurança dos dados de data/index.json (funciona sem servidor local). */
    static SEMENTE = [
        { id: 1, nome: "Monitor Gamer 27''", preco: 10.99, descricao: "Monitor Gamer 27'' 144Hz", categoria: "Monitores" },
        { id: 2, nome: "HP Notebook 15''", preco: 19.99, descricao: "HP Notebook 15'' 16GB RAM", categoria: "Portáteis" },
        { id: 3, nome: "Teclado Mecânico", preco: 5.99, descricao: "Teclado Mecânico RGB", categoria: "Periféricos" },
        { id: 4, nome: "Mouse Gamer", preco: 15.99, descricao: "Mouse Gamer 6 botões", categoria: "Periféricos" },
        { id: 5, nome: "Headset Gamer", preco: 25.99, descricao: "Headset Gamer 7.1 Surround", categoria: "Periféricos" },
        { id: 6, nome: "Wireless Mouse", preco: 12.99, descricao: "Mouse sem fio 6 botões", categoria: "Periféricos" },
        { id: 7, nome: "Mousepad Gamer", preco: 8.99, descricao: "Mousepad Gamer 800mm x 300mm", categoria: "Periféricos" },
        { id: 8, nome: "UPS 2.5VA 650W", preco: 78.99, descricao: "Uninterruptible Power Supply 2.5VA 650W", categoria: "Periféricos" },
        { id: 9, nome: "Teclado Wireless Mecânico", preco: 14.99, descricao: "Teclado sem fio Mecânico RGB", categoria: "Periféricos" },
        { id: 10, nome: "Macbook Pro 16''", preco: 22.99, descricao: "Macbook Pro 16'' 16GB RAM", categoria: "Portáteis" },
        { id: 11, nome: "Monitor Gamer 4K 27''", preco: 9.99, descricao: "Monitor Gamer 4K 27'' 120Hz", categoria: "Monitores" },
        { id: 12, nome: "Disco SSD 1TB", preco: 16.99, descricao: "Disco SSD 1TB 500MB/s", categoria: "Armazenamento" }
    ];
}
