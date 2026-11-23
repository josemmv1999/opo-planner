type ArticleRange = [from: number, to: number, topicId: number];

interface LawReference {
  pattern: RegExp;
  topicId: number;
  articles?: ArticleRange[];
}

const LAW_WEIGHT = 5;
const KEYWORD_WEIGHT = 1;

const LAW_REFERENCES: LawReference[] = [
  {
    pattern: /constitucion espanola/,
    topicId: 0,
    articles: [
      [1, 55, 1],
      [56, 65, 2],
      [66, 80, 3],
      [81, 86, 16],
      [87, 96, 3],
      [97, 116, 5],
      [117, 127, 4],
      [137, 139, 9],
      [140, 142, 10],
      [143, 158, 9],
      [159, 169, 1],
    ],
  },
  { pattern: /ley organica 2\/1979|ley organica 3\/1981/, topicId: 1 },
  { pattern: /ley organica 5\/1985|reglamento del (congreso|senado)/, topicId: 3 },
  { pattern: /ley organica 6\/1985|ley 50\/1981/, topicId: 4 },
  { pattern: /ley 50\/1997/, topicId: 5 },
  { pattern: /ley 19\/2013/, topicId: 7 },
  { pattern: /ley 2\/2014/, topicId: 8 },
  { pattern: /ley 7\/1985/, topicId: 10 },
  { pattern: /tratado de (la union europea|funcionamiento de la union europea)/, topicId: 11 },
  { pattern: /real decreto (366\/2007|208\/1996|951\/2005)/, topicId: 12 },
  { pattern: /real decreto 1708\/2011/, topicId: 13 },
  {
    pattern:
      /real decreto 203\/2021|orden hap\/1949\/2014|orden pcm\/138[23]\/2021|esquema nacional de (seguridad|interoperabilidad)/,
    topicId: 14,
  },
  { pattern: /ley organica 3\/2018|reglamento \(?ue\)? 2016\/679/, topicId: 15 },
  { pattern: /codigo civil/, topicId: 16 },
  {
    pattern: /ley 39\/2015/,
    topicId: 18,
    articles: [
      [13, 15, 14],
      [16, 17, 13],
      [26, 28, 13],
      [34, 52, 17],
    ],
  },
  {
    pattern: /ley 40\/2015/,
    topicId: 18,
    articles: [
      [32, 37, 21],
      [38, 46, 14],
      [54, 80, 8],
      [81, 158, 20],
    ],
  },
  { pattern: /ley 29\/1998/, topicId: 18 },
  { pattern: /ley 9\/2017/, topicId: 19 },
  { pattern: /ley 38\/2003/, topicId: 20 },
  {
    pattern:
      /ley organica (3\/2007|1\/2004)|ley (15\/2022|4\/2023|39\/2006|3\/2024)|real decreto legislativo 1\/2013|real decreto 1026\/2024/,
    topicId: 22,
  },
  {
    pattern: /real decreto legislativo 5\/2015|estatuto basico del empleado publico|\btrebep\b/,
    topicId: 23,
    articles: [
      [9, 10, 25],
      [11, 11, 30],
      [14, 54, 27],
      [55, 61, 24],
      [62, 68, 26],
      [69, 84, 27],
      [85, 92, 26],
      [93, 98, 28],
    ],
  },
  { pattern: /real decreto-ley 6\/2023/, topicId: 23, articles: [[113, 113, 24]] },
  { pattern: /real decreto 2073\/1999|registro central de personal/, topicId: 23 },
  { pattern: /ley 70\/1978|decreto 315\/1964/, topicId: 25 },
  {
    pattern: /ley 30\/1984/,
    topicId: 26,
    articles: [[23, 24, 35]],
  },
  { pattern: /real decreto 365\/1995/, topicId: 26 },
  { pattern: /real decreto 364\/1995/, topicId: 27 },
  { pattern: /ley 53\/1984|real decreto 33\/1986/, topicId: 28 },
  { pattern: /real decreto legislativo 4\/2000|real decreto 375\/2003|\bmuface\b/, topicId: 29 },
  { pattern: /convenio unico/, topicId: 30 },
  { pattern: /real decreto legislativo 8\/2015/, topicId: 31 },
  { pattern: /ley organica 2\/2012/, topicId: 32 },
  {
    pattern: /ley 47\/2003/,
    topicId: 33,
    articles: [
      [26, 41, 32],
      [63, 99, 34],
      [140, 175, 34],
    ],
  },
  { pattern: /resolucion de 20 de enero de 2014/, topicId: 33 },
  { pattern: /orden .{0,40}1 de febrero de 1996|ley organica 2\/1982/, topicId: 34 },
  { pattern: /real decreto 462\/2002/, topicId: 35 },
  { pattern: /real decreto (725\/1989|640\/1987)/, topicId: 36 },
];

const KEYWORDS: [topicId: number, pattern: RegExp][] = [
  [
    1,
    /derechos fundamentales|tribunal constitucional|defensor del pueblo|recurso de amparo|reforma constitucional/,
  ],
  [2, /\bel rey\b|\bal rey\b|la corona|regencia|refrendo/],
  [3, /cortes generales|congreso de los diputados|\bsenado\b|diputacion permanente/],
  [4, /poder judicial|tribunal supremo|audiencia nacional|ministerio fiscal/],
  [
    5,
    /presidente del gobierno|consejo de ministros|cuestion de confianza|mocion de censura|gobierno en funciones/,
  ],
  [6, /gobierno abierto|agenda 2030|desarrollo sostenible/],
  [7, /transparencia|acceso a la informacion publica|publicidad activa/],
  [
    8,
    /secretari[oa]s? de estado|subsecretari|delegad[oa]s? del gobierno|subdelegad|servicio exterior/,
  ],
  [9, /comunidad(es)? autonoma|estatutos? de autonomia/],
  [10, /municipio|provincia|ayuntamiento|alcalde|diputacion provincial|cabildo/],
  [11, /union europea|consejo europeo|parlamento europeo|comision europea/],
  [
    12,
    /atencion al (publico|ciudadano)|informacion administrativa|quejas|sugerencias|cartas de servicios|accesibilidad/,
  ],
  [13, /archivo|registro electronico|copias? autenticas?/],
  [14, /sede electronica|punto de acceso general|ventanilla unica|firma electronica|cl@ve/],
  [15, /proteccion de datos|datos personales|tratamiento de datos/],
  [
    16,
    /jerarquia normativa|decreto legislativo\b(?! \d)|decreto-ley\b(?! \d)|potestad reglamentaria/,
  ],
  [17, /acto administrativo|actos administrativos|nulidad|anulabilidad|notificaci/],
  [
    18,
    /silencio administrativo|recurso de alzada|recurso (potestativo )?de reposicion|revision de oficio|contencioso|subsanacion|plazo maximo para resolver/,
  ],
  [19, /contrato|adjudica|licitacion|valor estimado|organo de contratacion|prorroga/],
  [20, /subvencion|actividad de fomento|servicio publico|convenio/],
  [21, /responsabilidad patrimonial|indemnizacion por danos/],
  [22, /igualdad|violencia de genero|lgtbi|discapacidad|dependencia/],
  [23, /empleados? publicos?|clases de personal|personal eventual/],
  [24, /oferta de empleo publico|proceso selectivo|oposicion|tribunal calificador/],
  [25, /funcionari[oa]s? de carrera|funcionari[oa]s? interin|nombrad[oa] funcionari/],
  [
    26,
    /situaciones? administrativas?|excedencia|servicios especiales|servicio activo|toma de posesion|tomar posesion/,
  ],
  [
    27,
    /concurso de meritos|libre designacion|comision de servicios|grado (personal|consolidado)|permiso|vacaciones|promocion interna|comision de valoracion/,
  ],
  [28, /incompatibilidad|regimen disciplinario|falta (muy )?grave|faltas leves/],
  [29, /clases pasivas|mutualismo/],
  [30, /personal laboral|grupo profesional/],
  [31, /seguridad social|incapacidad temporal|prestaciones?/],
  [32, /principios presupuestarios|ciclo presupuestario|presupuesto por programas/],
  [
    33,
    /modificaci[oa]n(es)? presupuestaria|credito extraordinario|suplemento de credito|ampliacion de credito|generacion de credito|transferencia de credito|incorporacion de credito|anticipo de tesoreria|capitulo presupuestario|capitulo \d/,
  ],
  [
    34,
    /fases? del gasto|reconocimiento de la obligacion|ordenacion del pago|documentos? contables?|intervencion|tribunal de cuentas/,
  ],
  [
    35,
    /retribuciones|nominas?|trienios|pagas extraordinarias|complemento (de destino|especifico)|indemnizaciones por razon del servicio|dietas/,
  ],
  [36, /anticipos? de caja fija|pagos? a justificar|justificacion de libramientos/],
  [37, /gestion economica/],
];

const normalize = (text: string): string => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const lawTopics = (text: string): number[] =>
  LAW_REFERENCES.flatMap(({ pattern, topicId, articles = [] }) => {
    const match = pattern.exec(text);
    if (!match) return [];
    const article = [
      ...text.slice(Math.max(0, match.index - 80), match.index).matchAll(/articulos? (\d+)/g),
    ].at(-1)?.[1];
    const byArticle = articles.find(
      ([from, to]) => Number(article) >= from && Number(article) <= to,
    )?.[2];
    const topic = byArticle ?? topicId;
    return topic ? [{ topic, index: match.index }] : [];
  })
    .sort((a, b) => a.index - b.index)
    .map(({ topic }) => topic);

export const classifyQuestion = (statement: string, options: string[] = []): number | null => {
  const scores = new Map<number, number>();
  const add = (topicId: number, points: number) =>
    scores.set(topicId, (scores.get(topicId) ?? 0) + points);
  const normalizedStatement = normalize(statement);
  lawTopics(normalizedStatement).forEach((topicId, i) =>
    add(topicId, i === 0 ? LAW_WEIGHT + 1 : LAW_WEIGHT),
  );
  const text = normalize([statement, ...options].join(' '));
  KEYWORDS.forEach(([topicId, pattern]) => pattern.test(text) && add(topicId, KEYWORD_WEIGHT));
  const [best] = [...scores].sort(([, a], [, b]) => b - a);
  return best?.[0] ?? null;
};
