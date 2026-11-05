/* ============================================================
   VINTTESETE — Base de dados (front-end, fácil de editar)
   Para adicionar produto: copie um bloco e mude os valores.
   ============================================================ */

const CATEGORIAS = [
  { id: "cargo", nome: "Cargo", desc: "Bolsos utilitários" },
  { id: "baggy", nome: "Baggy", desc: "Wide fit" },
  { id: "reta", nome: "Reta", desc: "Corte clássico" },
  { id: "balao", nome: "Balão", desc: "Volume alto" },
  { id: "moletom", nome: "Moletom", desc: "Conforto total" },
  
];

const IMG = {
  cargo: "images/p-cargo.jpg",
  baggy: "images/p-baggy.jpg",
  moletom: "images/p-moletom.jpg",
  flare: "images/p-flare.jpg",
  balao: "images/p-balao.jpg",
};

const PRODUTOS = [{"id": 1, "nome": "Cargo jeans", "cat": "cargo", "preco": 149.9, "de": 189.9, "img": "images/p-cargo.jpg", "cores": ["Preto", "Marinho"], "tags": ["novo", "destaque"], "estoque": {"P": 4, "M": 9, "G": 7, "GG": 3}, "nota": 0, "avaliacoes": 0, "desc": "Cargo de sarja pesada com seis bolsos, cordão interno e caimento wide. Peça-chave do line-up urbano da Vinttesete."}, {"id": 2, "nome": "Cargo Camuflagem Clara", "cat": "cargo", "preco": 139.9, "de": 0, "img": "images/p-cargo.jpg", "cores": ["Camuflado claro"], "tags": ["destaque"], "estoque": {"P": 2, "M": 5, "G": 6, "GG": 0}, "nota": 0, "avaliacoes": 0, "desc": "Cargo camuflada em tom claro, com múltiplos bolsos utilitários e caimento wide."}, {"id": 3, "nome": "Baggy Letrado", "cat": "baggy", "preco": 149.9, "de": 199.9, "img": "images/p-baggy.jpg", "cores": ["Preto"], "tags": ["novo", "destaque"], "estoque": {"P": 6, "M": 11, "G": 8, "GG": 4}, "nota": 0, "avaliacoes": 0, "desc": "Baggy preta desbotada com lettering manuscrito na lateral, cintura alta e perna super ampla."}, {"id": 4, "nome": "Baggy Leopardo", "cat": "baggy", "preco": 179.9, "de": 0, "img": "images/p-baggy.jpg", "cores": ["Onça"], "tags": [], "estoque": {"P": 3, "M": 2, "G": 5, "GG": 2}, "nota": 0, "avaliacoes": 0, "desc": "Baggy com estampa leopardo e aplicação de strass nas laterais, modelagem wide leg."}, {"id": 7, "nome": "Jeans Vintage", "cat": "flare", "preco": 139.9, "de": 0, "img": "images/p-flare.jpg", "cores": ["Azul escuro"], "tags": ["novo"], "estoque": {"P": 4, "M": 6, "G": 3, "GG": 2}, "nota": 0, "avaliacoes": 0, "desc": "Flare em denim com lavagem vintage escura, cintura média e boca ampla."}, {"id": 8, "nome": "Flare Moletom Feminina", "cat": "flare", "preco": 149.9, "de": 0, "img": "images/p-flare.jpg", "cores": ["Cinza"], "tags": ["destaque"], "estoque": {"P": 1, "M": 3, "G": 2, "GG": 0}, "nota": 0, "avaliacoes": 0, "desc": "Flare de moletom feminina com cós alto canelado, cordão e boca flare."}, {"id": 9, "nome": "Reta Utility Black", "cat": "reta", "preco": 109.9, "de": 139.9, "img": "images/p-alfaiataria.jpg", "cores": ["Preto"], "tags": [], "estoque": {"P": 8, "M": 10, "G": 6, "GG": 4}, "nota": 0, "avaliacoes": 0, "desc": "Corte reto em sarja com bolso oculto e acabamento premium."}, {"id": 10, "nome": "Reta Navy Classic", "cat": "reta", "preco": 99.9, "de": 0, "img": "images/p-alfaiataria.jpg", "cores": ["Marinho"], "tags": [], "estoque": {"P": 3, "M": 4, "G": 5, "GG": 2}, "nota": 0, "avaliacoes": 0, "desc": "Reta azul-marinho de caimento seco, versátil do dia à noite."}, {"id": 11, "nome": "Jeans customized pocket", "cat": "balao", "preco": 129.9, "de": 0, "img": "images/p-balao.jpg", "cores": ["Azul escuro"], "tags": ["novo"], "estoque": {"P": 5, "M": 7, "G": 4, "GG": 3}, "nota": 0, "avaliacoes": 0, "desc": "Calça jeans escura com bolso frontal em xadrez, modelagem balão e caimento único."}, {"id": 12, "nome": "Y2K", "cat": "balao", "preco": 139.9, "de": 179.9, "img": "images/p-balao.jpg", "cores": ["Preto"], "tags": ["destaque"], "estoque": {"P": 2, "M": 3, "G": 1, "GG": 0}, "nota": 0, "avaliacoes": 0, "desc": "Calça balão Y2K em jeans preto com estampa oversized, estrelas e lettering."}, {"id": 15, "nome": "Moletom Letrado", "cat": "moletom", "preco": 159.9, "de": 199.9, "img": "images/p-moletom.jpg", "cores": ["Cinza"], "tags": ["destaque", "novo"], "estoque": {"P": 9, "M": 14, "G": 11, "GG": 6}, "nota": 0, "avaliacoes": 0, "desc": "Moletom cinza com lettering aplicado na perna, cós elástico com cordão e caimento wide."}, {"id": 16, "nome": "Moletom Bordado em 3D", "cat": "moletom", "preco": 159.9, "de": 199.9, "img": "images/p-moletom.jpg", "cores": ["Cinza"], "tags": [], "estoque": {"P": 6, "M": 9, "G": 7, "GG": 5}, "nota": 0, "avaliacoes": 0, "desc": "Moletom cinza com bordado 3D na lateral, cós elástico e modelagem ampla."}];

const TAMANHOS = ["P", "M", "G", "GG"];

const AVALIACOES = [];

const PEDIDOS = [];

const WHATSAPP = "5585982090674";
const INSTAGRAM = "https://instagram.com/vinttesete";