// ─── Catálogo Cubanos — 130 vitolas Habanos ───────────────────────────────────
// Fonte de verdade curada manualmente (Habanos S.A.). Consumida por
// scripts/seed-cuban-cigars.js e disponível para o prompt da IA de
// identificação (CATALOG_TEXT).
//
// Formato: [marca, linha, vitola, galera, mm, cepo, força, min_fumada]
// Força: "suave" | "suave-médio" | "médio" | "médio-forte" | "forte"
// (constants/strength.ts normaliza esses rótulos para os 4 buckets do app.)

const CATALOGO = [
  // ── Cohiba ──────────────────────────────────────────────────────────────────
  ["Cohiba","Línea Clásica","Lanceros","Laguito No. 1",192,38,"médio-forte",80],
  ["Cohiba","Línea Clásica","Coronas Especiales","Laguito No. 2",152,38,"médio-forte",55],
  ["Cohiba","Línea Clásica","Panetelas","Laguito No. 3",115,26,"médio",30],
  ["Cohiba","Línea Clásica","Robustos","Robustos",124,50,"médio-forte",60],
  ["Cohiba","Línea Clásica","Esplendidos","Julieta No. 2",178,47,"médio-forte",90],
  ["Cohiba","Línea Clásica","Exquisitos","Seoane",126,36,"médio",40],
  ["Cohiba","Línea 1492","Siglo I","Perlas",102,40,"médio",30],
  ["Cohiba","Línea 1492","Siglo II","Marevas",129,42,"médio",45],
  ["Cohiba","Línea 1492","Siglo III","Coronas Grandes",155,42,"médio",60],
  ["Cohiba","Línea 1492","Siglo IV","Coronas Gordas",143,46,"médio-forte",65],
  ["Cohiba","Línea 1492","Siglo V","Dalias",170,43,"médio-forte",75],
  ["Cohiba","Línea 1492","Siglo VI","Cañonazo",150,52,"médio-forte",75],
  ["Cohiba","Behike","BHK 52","Laguito No. 4",119,52,"forte",60],
  ["Cohiba","Behike","BHK 54","Laguito No. 5",144,54,"forte",75],
  ["Cohiba","Behike","BHK 56","Laguito No. 6",166,56,"forte",90],
  ["Cohiba","Maduro 5","Genios","Genios",140,52,"forte",70],
  ["Cohiba","Maduro 5","Mágicos","Mágicos",115,52,"forte",55],
  ["Cohiba","Maduro 5","Secretos","Secretos",110,40,"médio-forte",35],

  // ── Montecristo ─────────────────────────────────────────────────────────────
  ["Montecristo","Línea Regular","No. 1","Cervantes",165,42,"médio",65],
  ["Montecristo","Línea Regular","No. 2","Pirámides",156,52,"médio-forte",80],
  ["Montecristo","Línea Regular","No. 3","Coronas",142,42,"médio",55],
  ["Montecristo","Línea Regular","No. 4","Marevas",129,42,"médio",45],
  ["Montecristo","Línea Regular","No. 5","Perlas",102,40,"médio",30],
  ["Montecristo","Línea Regular","Media Corona","Half Corona",90,44,"médio",30],
  ["Montecristo","Edmundo","Edmundo","Edmundo",135,52,"médio-forte",65],
  ["Montecristo","Edmundo","Petit Edmundo","Petit Edmundo",110,52,"médio-forte",45],
  ["Montecristo","Edmundo","Double Edmundo","Dobles",155,50,"médio-forte",80],
  ["Montecristo","Open","Eagle","Geniales",150,54,"médio",70],
  ["Montecristo","Open","Master","Robustos",124,50,"médio",60],
  ["Montecristo","Open","Regata","Forum",135,46,"médio",55],
  ["Montecristo","Open","Junior","Trabucos",110,38,"médio",30],
  ["Montecristo","Línea 1935","Leyenda","Maravillas No. 2",165,55,"médio-forte",90],
  ["Montecristo","Línea 1935","Maltés","Escalados",153,53,"médio-forte",80],
  ["Montecristo","Línea 1935","Dumas","Marsellas",130,49,"médio-forte",60],

  // ── Partagás ─────────────────────────────────────────────────────────────────
  ["Partagás","Serie D","Serie D No. 4","Robustos",124,50,"forte",60],
  ["Partagás","Serie D","Serie D No. 5","D No. 5",110,50,"forte",45],
  ["Partagás","Serie D","Serie D No. 6","D No. 6",90,50,"forte",35],
  ["Partagás","Serie E","Serie E No. 2","Duke",140,54,"forte",75],
  ["Partagás","Serie P","Serie P No. 2","Pirámides",156,52,"forte",80],
  ["Partagás","Línea Clásica","Lusitanias","Prominentes",194,49,"forte",100],
  ["Partagás","Línea Clásica","8-9-8","Dalias",170,43,"médio-forte",75],
  ["Partagás","Línea Clásica","Coronas Senior","Eminentes",132,44,"médio-forte",50],
  ["Partagás","Línea Clásica","Coronas Junior","Coronitas",115,42,"médio-forte",40],
  ["Partagás","Línea Clásica","Shorts","Minutos",110,42,"forte",35],
  ["Partagás","Línea Clásica","Mille Fleurs","Petit Coronas",129,42,"médio",45],
  ["Partagás","Línea Clásica","Presidentes","Tacos",158,47,"forte",75],

  // ── Romeo y Julieta ──────────────────────────────────────────────────────────
  ["Romeo y Julieta","Churchills","Churchills","Julieta No. 2",178,47,"médio",90],
  ["Romeo y Julieta","Churchills","Short Churchills","Robustos",124,50,"médio",60],
  ["Romeo y Julieta","Churchills","Wide Churchills","Montescos",130,55,"médio",65],
  ["Romeo y Julieta","Churchills","Petit Churchills","Petit Robustos",102,50,"médio",40],
  ["Romeo y Julieta","Línea Regular","No. 1","Coronas",142,42,"médio",55],
  ["Romeo y Julieta","Línea Regular","No. 2","Petit Coronas",129,42,"médio",45],
  ["Romeo y Julieta","Línea Regular","No. 3","Coronitas",115,42,"médio",40],
  ["Romeo y Julieta","Línea Regular","Belicosos","Campanas",140,52,"médio",70],
  ["Romeo y Julieta","Línea Regular","Mille Fleurs","Petit Coronas",129,42,"médio",45],
  ["Romeo y Julieta","Línea de Oro","Dianas","Dianas",145,52,"médio-forte",70],
  ["Romeo y Julieta","Línea de Oro","Hidalgos","Hidalgos",125,57,"médio-forte",60],
  ["Romeo y Julieta","Línea de Oro","Nobles","Nobles",135,56,"médio-forte",65],

  // ── Hoyo de Monterrey ────────────────────────────────────────────────────────
  ["Hoyo de Monterrey","Epicure","Epicure No. 1","Coronas Gordas",143,46,"suave-médio",65],
  ["Hoyo de Monterrey","Epicure","Epicure No. 2","Robustos",124,50,"suave-médio",60],
  ["Hoyo de Monterrey","Epicure","Epicure Especial","Gemelos",141,50,"suave-médio",65],
  ["Hoyo de Monterrey","Le Hoyo","Le Hoyo de San Juan","Geniales",150,54,"médio",70],
  ["Hoyo de Monterrey","Le Hoyo","Le Hoyo de Río Seco","D No. 56",140,56,"médio",70],
  ["Hoyo de Monterrey","Línea Clásica","Double Coronas","Prominentes",194,49,"suave-médio",100],
  ["Hoyo de Monterrey","Línea Clásica","Petit Robustos","Petit Robustos",102,50,"suave-médio",40],

  // ── H. Upmann ────────────────────────────────────────────────────────────────
  ["H. Upmann","Magnum","Magnum 46","Coronas Gordas",143,46,"suave-médio",65],
  ["H. Upmann","Magnum","Magnum 50","Magnum 50",160,50,"suave-médio",80],
  ["H. Upmann","Magnum","Magnum 54","Magnum 54",120,54,"suave-médio",55],
  ["H. Upmann","Línea Clásica","Sir Winston","Julieta No. 2",178,47,"médio",90],
  ["H. Upmann","Línea Clásica","Connossieur No. 1","Hermosos No. 4",127,48,"suave-médio",55],
  ["H. Upmann","Línea Clásica","Connossieur A","A",139,52,"suave-médio",65],
  ["H. Upmann","Línea Clásica","Half Corona","Half Corona",90,44,"suave-médio",30],
  ["H. Upmann","Línea Clásica","Regalias","Petit Coronas",129,42,"suave-médio",45],

  // ── Bolívar ──────────────────────────────────────────────────────────────────
  ["Bolívar","Línea Regular","Belicosos Finos","Campanas",140,52,"forte",70],
  ["Bolívar","Línea Regular","Royal Coronas","Robustos",124,50,"forte",60],
  ["Bolívar","Línea Regular","Coronas Junior","Minutos",110,42,"forte",35],
  ["Bolívar","Línea Regular","Petit Coronas","Petit Coronas",129,42,"forte",45],

  // ── Punch ────────────────────────────────────────────────────────────────────
  ["Punch","Línea Regular","Punch Punch","Coronas Gordas",143,46,"médio",65],
  ["Punch","Línea Regular","Double Coronas","Prominentes",194,49,"médio",100],
  ["Punch","Línea Regular","Short de Punch","D No. 5 Especial",120,50,"médio",50],
  ["Punch","Línea Regular","Petit Coronations","Coronitas",115,42,"médio",40],

  // ── Ramón Allones ────────────────────────────────────────────────────────────
  ["Ramón Allones","Línea Regular","Specially Selected","Robustos",124,50,"forte",60],
  ["Ramón Allones","Línea Regular","Gigantes","Prominentes",194,49,"forte",100],
  ["Ramón Allones","Línea Regular","Small Club Coronas","Minutos",110,42,"médio-forte",35],

  // ── Trinidad ─────────────────────────────────────────────────────────────────
  ["Trinidad","Línea Regular","Fundadores","Laguito Especial",192,40,"médio",85],
  ["Trinidad","Línea Regular","Reyes","Reyes",110,40,"médio",35],
  ["Trinidad","Línea Regular","Coloniales","Coloniales",132,44,"médio",55],
  ["Trinidad","Línea Regular","Vigía","Torres",110,54,"médio",50],
  ["Trinidad","Línea Regular","Media Luna","Media Luna",115,50,"médio",45],
  ["Trinidad","Línea Regular","Topes","Topes",125,56,"médio-forte",60],
  ["Trinidad","Línea Regular","Esmeralda","Petit Pirámides",145,53,"médio",70],

  // ── Cuaba ────────────────────────────────────────────────────────────────────
  ["Cuaba","Línea Regular","Divinos","Petit Bouquet",101,43,"médio",35],
  ["Cuaba","Línea Regular","Tradicionales","Favoritos",120,42,"médio",45],
  ["Cuaba","Línea Regular","Salomones","Salomón",184,57,"médio",100],

  // ── Vegas Robaina ─────────────────────────────────────────────────────────────
  ["Vegas Robaina","Línea Regular","Famosos","Hermosos No. 4",127,48,"médio-forte",55],
  ["Vegas Robaina","Línea Regular","Unicos","Pirámides",156,52,"médio-forte",80],

  // ── San Cristóbal de La Habana ───────────────────────────────────────────────
  ["San Cristóbal de La Habana","Línea Regular","El Príncipe","Minutos",110,42,"médio",35],
  ["San Cristóbal de La Habana","Línea Regular","La Fuerza","Gordos",141,50,"médio",65],
  ["San Cristóbal de La Habana","Línea Regular","La Punta","Campanas",140,52,"médio",70],

  // ── Vegueros ─────────────────────────────────────────────────────────────────
  ["Vegueros","Línea Regular","Entretiempos","Petit Edmundo",110,52,"médio",45],
  ["Vegueros","Línea Regular","Tapados","Mareva Gruesa",120,46,"médio",45],
  ["Vegueros","Línea Regular","Mañanitas","Petit Pirámide",100,46,"médio",35],
  ["Vegueros","Línea Regular","Centrofinos","Petit Robustos",102,50,"médio",40],

  // ── José L. Piedra ───────────────────────────────────────────────────────────
  ["José L. Piedra","Línea Regular","Cazadores","Cazadores JLP",152,43,"médio",60],
  ["José L. Piedra","Línea Regular","Petit Cazadores","Petit Cazadores JLP",105,43,"médio",35],
  ["José L. Piedra","Línea Regular","Petit Caballeros","Petit Caballeros",120,39,"médio",40],

  // ── Quai d'Orsay ─────────────────────────────────────────────────────────────
  ["Quai d'Orsay","Línea Regular","No. 50","D No. 5",110,50,"suave",45],
  ["Quai d'Orsay","Línea Regular","No. 54","Edmundo Grueso",135,54,"suave-médio",65],
  ["Quai d'Orsay","Línea Regular","Coronas Claro","Coronas",142,42,"suave",55],

  // ── Juan López ───────────────────────────────────────────────────────────────
  ["Juan López","Línea Regular","Selección No. 1","Coronas Gordas",143,46,"médio",65],
  ["Juan López","Línea Regular","Selección No. 2","Robustos",124,50,"médio",60],

  // ── El Rey del Mundo ─────────────────────────────────────────────────────────
  ["El Rey del Mundo","Línea Regular","Choix Supreme","Hermosos No. 4",127,48,"suave",55],
  ["El Rey del Mundo","Línea Regular","Demi Tasse","Entreactos",100,30,"suave",20],

  // ── Rafael González ──────────────────────────────────────────────────────────
  ["Rafael González","Línea Regular","Perlas","Perlas",102,40,"suave",30],
  ["Rafael González","Línea Regular","Petit Coronas","Petit Coronas",129,42,"suave",45],

  // ── Por Larrañaga ────────────────────────────────────────────────────────────
  ["Por Larrañaga","Línea Regular","Petit Coronas","Petit Coronas",129,42,"suave-médio",45],
  ["Por Larrañaga","Línea Regular","Montecarlos","Deliciosos",159,33,"suave-médio",50],
  ["Por Larrañaga","Línea Regular","Galanes","Galanes",120,52,"suave-médio",50],

  // ── Quintero ─────────────────────────────────────────────────────────────────
  ["Quintero","Línea Regular","Favoritos","Concha No. 1",120,50,"médio",50],
  ["Quintero","Línea Regular","Brevas","Nacionales",140,42,"médio",55],
  ["Quintero","Línea Regular","Petit Quinteros","Standard",110,40,"médio",35],
  ["Quintero","Línea Regular","Londres Extra","Standard",124,40,"médio",40],

  // ── Fonseca ──────────────────────────────────────────────────────────────────
  ["Fonseca","Línea Regular","Cosacos","Cosacos",135,42,"suave",50],
  ["Fonseca","Línea Regular","KDT Cadetes","Cadetes",115,36,"suave",30],
  ["Fonseca","Línea Regular","Delicias","Standard",124,40,"suave",40],

  // ── Diplomáticos ─────────────────────────────────────────────────────────────
  ["Diplomáticos","Línea Regular","No. 2","Pirámides",156,52,"médio",80],

  // ── Saint Luis Rey ───────────────────────────────────────────────────────────
  ["Saint Luis Rey","Línea Regular","Regios","Hermosos No. 4",127,48,"médio-forte",55],

  // ── La Gloria Cubana ─────────────────────────────────────────────────────────
  ["La Gloria Cubana","Línea Regular","Medaille d'Or No. 4","Panetelas Largas",175,32,"suave-médio",55],

  // ── Sancho Panza ─────────────────────────────────────────────────────────────
  ["Sancho Panza","Línea Regular","Belicosos","Campanas",140,52,"médio",70],
  ["Sancho Panza","Línea Regular","Non Plus","Marevas",129,42,"médio",45],
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converte uma linha do array para objeto nomeado */
function toObject([marca, linha, vitola, galera, mm, cepo, forca, min_fumada]) {
  return { marca, linha, vitola, galera, mm, cepo, forca, min_fumada };
}

/** Lista de marcas únicas */
const MARCAS = [...new Set(CATALOGO.map((r) => r[0]))];

/** Linhas únicas de uma marca */
function linhasDe(marca) {
  return [...new Set(CATALOGO.filter((r) => r[0] === marca).map((r) => r[1]))];
}

/** Vitolas de uma marca + linha */
function vitolasDe(marca, linha) {
  return CATALOGO.filter((r) => r[0] === marca && r[1] === linha).map((r) => r[2]);
}

/** Texto plano para o prompt da IA (marca | linha | vitola) */
const CATALOG_TEXT = CATALOGO.map((r) => `${r[0]} | ${r[1]} | ${r[2]}`).join('\n');

/** Busca por texto livre (marca + linha + vitola) */
function buscar(query, max = 8) {
  const q = query.toLowerCase();
  return CATALOGO.filter((r) =>
    `${r[0]} ${r[1]} ${r[2]}`.toLowerCase().includes(q)
  ).slice(0, max);
}

/** Encontra entrada exata (para validar retorno da IA) */
function encontrar(marca, linha, vitola) {
  return CATALOGO.find((r) => r[0] === marca && r[1] === linha && r[2] === vitola) ?? null;
}

const FORCAS = ['suave', 'suave-médio', 'médio', 'médio-forte', 'forte'];
const FORCA_DOTS = { 'suave': 1, 'suave-médio': 2, 'médio': 3, 'médio-forte': 4, 'forte': 5 };

module.exports = {
  CATALOGO,
  toObject,
  MARCAS,
  linhasDe,
  vitolasDe,
  CATALOG_TEXT,
  buscar,
  encontrar,
  FORCAS,
  FORCA_DOTS,
};
