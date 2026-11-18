/**
 * produto.js
 * Classe que representa um produto do catálogo (POO).
 */

class Produto {

    constructor(id, nome, preco, descricao, categoria) {
        this.id = id;
        this.nome = nome;
        this.preco = preco;
        this.descricao = descricao;
        this.categoria = categoria;
    }

    /* Preço formatado em euros, para apresentação na tabela. */
    get precoFormatado() {
        return new Intl.NumberFormat("pt-PT", {
            style: "currency",
            currency: "EUR"
        }).format(this.preco);
    }

    /* Cria um Produto a partir de um objeto simples vindo do JSON / localStorage. */
    static fromJSON(objeto) {
        return new Produto(
            Number(objeto.id),
            String(objeto.nome).trim(),
            Number(objeto.preco),
            String(objeto.descricao).trim(),
            String(objeto.categoria).trim()
        );
    }

    /**
     * Valida os dados introduzidos no formulário.
     * Devolve um objeto { campo: mensagem } — vazio quando está tudo correto.
     */
    static validar(dados) {

        const erros = {};

        const nome = (dados.nome || "").trim();
        const descricao = (dados.descricao || "").trim();
        const categoria = (dados.categoria || "").trim();
        const preco = dados.preco;

        if (nome === "") {
            erros.nome = "O nome é obrigatório.";
        } else if (nome.length < 2) {
            erros.nome = "O nome deve ter pelo menos 2 caracteres.";
        }

        if (dados.preco === "" || dados.preco === null || Number.isNaN(preco)) {
            erros.preco = "O preço é obrigatório e deve ser um número.";
        } else if (preco < 0) {
            erros.preco = "O preço não pode ser negativo.";
        } else if (preco === 0) {
            erros.preco = "O preço deve ser maior do que zero.";
        }

        if (descricao === "") {
            erros.descricao = "A descrição é obrigatória.";
        }

        if (categoria === "") {
            erros.categoria = "A categoria é obrigatória.";
        }

        return erros;
    }

    /* Verifica se um objeto tem a forma esperada de um produto (usado na importação). */
    static eValido(objeto) {
        return objeto !== null
            && typeof objeto === "object"
            && "nome" in objeto
            && "preco" in objeto
            && "categoria" in objeto;
    }
}
