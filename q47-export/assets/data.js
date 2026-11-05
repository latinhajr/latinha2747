/* ==========================================================
   QUARENTA&SETE — dados do catálogo
   Para adicionar um produto novo, basta copiar um objeto
   abaixo e alterar os campos. Nada mais precisa ser mudado.
   ========================================================== */

window.Q47 = window.Q47 || {};

window.Q47.brand = {
  name: "QUARENTA&SETE",
  slogan: "CREATE YOUR LEGACY",
  instagram: "quarentaiisete",
  instagramUrl: "https://instagram.com/quarentaiisete",
  whatsapp: "5585988079247",
  whatsappLabel: "+55 (85) 98807-9247",
  email: "contato@quarentaesete.com",
};

window.Q47.categories = [
  { id: "todos", label: "Todos" },
  { id: "polos", label: "Polos" },
  { id: "blusas", label: "Blusas" },
  { id: "novidades", label: "Novidades" },
];

window.Q47.products = [
  {
    id: "polo-floral-rosa",
    name: "Polo Floral Rosa Chiclete",
    price: 119.9,
    category: "polos",
    tag: "Best seller",
    sizes: ["PP", "P", "M", "G", "GG"],
    images: ["../img/p-polo-rosa.jpg", "../img/p-polo-rosa-2.jpg"],
    short: "Polo rosa com estampa floral e franzido lateral.",
    description:
      "Blusa polo em malha suave rosa chiclete, gola aberta em V, manga curta e estampa floral pintada à mão em tons de rosa e verde. Franzido lateral que marca a cintura e valoriza a silhueta.",
  },
  {
    id: "polo-floral-branca",
    name: "Polo Floral Azul Porcelana",
    price: 129.9,
    category: "polos",
    tag: "Novo",
    sizes: ["PP", "P", "M", "G", "GG"],
    images: ["../img/p-polo-branca.jpg", "../img/p-polo-branca-2.jpg"],
    short: "Polo branca com estampa floral azul e caimento ajustado.",
    description:
      "Polo branca em malha lisa com estampa floral azul porcelana no peito e na lateral. Gola clássica com decote em V, manga curta e franzido nas laterais para um caimento ajustado.",
  },
  {
    id: "regata-laise-branca",
    name: "Blusa Laise Branca Alcinha",
    price: 149.9,
    category: "blusas",
    tag: "Novidade",
    sizes: ["PP", "P", "M", "G", "GG"],
    images: ["../img/p-regata-laise.jpg", "../img/p-polo-branca.jpg"],
    short: "Blusa de laise branca com busto franzido e amarração.",
    description:
      "Blusa em tecido laise branco com bordado inglês, alças largas, busto franzido com amarração central e barra evasê. Leve, fresca e perfeita para os dias quentes.",
  },
];

window.Q47.sizeGuide = [
  { size: "P", chest: "108 cm", length: "68 cm" },
  { size: "M", chest: "114 cm", length: "71 cm" },
  { size: "G", chest: "120 cm", length: "74 cm" },
  { size: "GG", chest: "126 cm", length: "77 cm" },
  { size: "XGG", chest: "132 cm", length: "80 cm" },
];

window.Q47.process = [
  {
    n: "01",
    title: "Empatia",
    sub: "Pesquisa com jovens",
    text: "Entendemos os estilos, preferências, necessidades e dificuldades dos jovens na hora de escolher suas roupas.",
    icon: "M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10z",
  },
  {
    n: "02",
    title: "Definição",
    sub: "Definir o desafio",
    text: "Identificamos o que os jovens procuram em uma marca de roupas: preço, qualidade, conforto, estilo e exclusividade.",
    icon: "M12 3v18M3 12h18M5 5l14 14",
  },
  {
    n: "03",
    title: "Ideação",
    sub: "Dinâmica de ideias",
    text: "Criamos ideias de peças, coleções, estampas e estilos diferentes pensando no nosso público.",
    icon: "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z",
  },
  {
    n: "04",
    title: "Prototipação",
    sub: "Coleção experimental",
    text: "Desenvolvemos modelos e protótipos das roupas para visualizar como serão antes da produção final.",
    icon: "M4 7l8-4 8 4-8 4-8-4zm0 5l8 4 8-4M4 17l8 4 8-4",
  },
  {
    n: "05",
    title: "Validação",
    sub: "Feedback do público",
    text: "Mostramos as peças para o público, coletamos opiniões e identificamos o que pode ser melhorado antes do lançamento.",
    icon: "M20 6L9 17l-5-5",
  },
];
