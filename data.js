// ============================================================
//  DIGITAL STRINGS — BASE DE DATOS DE SERVICIOS (v2)
// ============================================================

const DB = {

  ceremonia: [
    {
      id: "c-trio",
      nombre: "Trío",
      descripcion: "Piano, Violín y Cantante",
      horas: 1,
      precio: 1260000,
      categoria: "musica"
    },
    {
      id: "c-cuarteto",
      nombre: "Cuarteto",
      descripcion: "Violín, Piano, Soprano y Tenor",
      horas: 1,
      precio: 1680000,
      categoria: "musica"
    },
    {
      id: "c-cuarteto-strings",
      nombre: "Cuarteto Strings",
      descripcion: "Cello, Viola, Violín II & Violín I",
      horas: 1,
      precio: 1680000,
      categoria: "musica"
    },
    {
      id: "c-cuarteto-strings-cantante",
      nombre: "Cuarteto Strings & Cantante",
      descripcion: "Cello, Viola, Violín II & Violín I, Cantante",
      horas: 1,
      precio: 2100000,
      categoria: "musica"
    },
    {
      id: "c-quinteto",
      nombre: "Quinteto",
      descripcion: "Piano, Violín, Cello, Soprano y Tenor",
      horas: 1,
      precio: 2100000,
      categoria: "musica"
    },
    {
      id: "c-noneto",
      nombre: "Noneto",
      descripcion: "Cuarteto de cuerdas, Cuarteto Vocal y Piano",
      horas: 1,
      precio: 4200000,
      categoria: "musica"
    },
    {
      id: "c-ensamble",
      nombre: "Ensamble de Cámara",
      descripcion: "Ensamble de Cámara de 18 Artistas",
      horas: 1,
      precio: 7980000,
      categoria: "musica"
    },
    {
      id: "c-sonido",
      nombre: "Sonido Ceremonia Aire Libre",
      descripcion: "2 cabinas 12\" EV, microfonería inalámbrica para el pastor y novios. Cobertura para la amplificación de los músicos. Consola e ingeniería de sonido.",
      horas: 1,
      precio: 700000,
      categoria: "sonido",
      noCapilla: true
    }
  ],

  coctel: [
    {
      id: "co-sax",
      nombre: "Show Sax",
      descripcion: "Saxofón con Pistas. Show de cóctel itinerante.",
      horas: 1,
      precio: 900000,
      categoria: "musica"
    },
    {
      id: "co-violin",
      nombre: "Show Violín",
      descripcion: "Violín con Pistas. Show de cóctel itinerante.",
      horas: 1,
      precio: 900000,
      categoria: "musica"
    },
    {
      id: "co-trio-crossover",
      nombre: "Trío Crossover",
      descripcion: "Piano, Pad y Guitarrista Cantante",
      horas: 1,
      precio: 1800000,
      categoria: "banda"
    },
    {
      id: "co-gypsys",
      nombre: "The Gypsys Digital Strings",
      descripcion: "",
      horas: 1,
      precio: 2400000,
      categoria: "show"
    },
    {
      id: "co-strings-band",
      nombre: "Strings Band",
      descripcion: "Guitarra, Batería, Bajo Eléctrico, Violín Eléctrico y Cantante",
      horas: 1,
      precio: 3000000,
      categoria: "banda"
    },
    {
      id: "co-sonido",
      nombre: "Sonido Cóctel",
      descripcion: "2 cabinas 8\" EV, microfonería, consola e ingeniería de sonido",
      horas: 1,
      precio: 500000,
      categoria: "sonido"
    }
  ],

  protocolo: [
    {
      id: "p-maestro",
      nombre: "Maestro de Ceremonias",
      descripcion: "Cada momento de tu evento será dirigido por un Maestro de Ceremonias profesional, responsable de coordinar, presentar y animar cada etapa con elegancia, asegurando una experiencia organizada y emocionante.",
      horas: 8,
      precio: 1700000,
      categoria: "show"
    },
    {
      id: "p-dj-basic",
      nombre: "DJ Crossover",
      descripcion: "La fiesta y la energía estarán a cargo de un DJ crossover profesional, con una selección musical dinámica para cada generación y cada momento, garantizando una rumba divertida y llena de ambiente.",
      horas: 8,
      precio: 1200000,
      categoria: "dj"
    },
    {
      id: "p-dj-premium",
      nombre: "DJ Crossover Premium",
      descripcion: "La música y la experiencia estarán a cargo de uno de los DJs más destacados de Colombia, con una selección musical exclusiva y personalizada para cada generación y cada momento de tu celebración, garantizando una rumba inolvidable.",
      horas: 8,
      precio: 3000000,
      categoria: "dj"
    }
  ],

  cena: [
    {
      id: "ce-duo",
      nombre: "Dúo Digital Strings",
      descripcion: "Violín Eléctrico y Bajo Eléctrico",
      horas: 1,
      precio: 1400000,
      categoria: "musica"
    },
    {
      id: "ce-trio-marimba",
      nombre: "Trío MatimbaBeat",
      descripcion: "Marimba, Guitarra & Pad",
      horas: 1,
      precio: 1800000,
      categoria: "musica"
    },
    {
      id: "ce-flashmob-4",
      nombre: "Flashmob Digital Strings 4",
      descripcion: "Sorpresa musical en vivo durante la cena",
      horas: 1,
      precio: 3200000,
      categoria: "show"
    },
    {
      id: "ce-flashmob-7",
      nombre: "Flashmob Digital Strings 7",
      descripcion: "Sorpresa musical en vivo durante la cena",
      horas: 1,
      precio: 5600000,
      categoria: "show"
    }
  ],

  fiesta: [
    {
      id: "f-hora-loca",
      nombre: "Hora Loca",
      descripcion: "Hora loca 3 integrantes. Show moderno de saxofón, percusión y cantante. Incluye champeta, reggaetón y música electrónica.",
      horas: 1,
      precio: 2200000,
      categoria: "show"
    },
    {
      id: "f-parranda",
      nombre: "Parranda Vallenata",
      descripcion: "Parranda Vallenata 6 integrantes",
      horas: 1,
      precio: 2200000,
      categoria: "show"
    },
    {
      id: "f-trio-crossover",
      nombre: "Trío Crossover",
      descripcion: "Piano, Pad y Guitarrista Cantante",
      horas: 2,
      precio: 3200000,
      categoria: "banda"
    },
    {
      id: "f-tropical-7",
      nombre: "Tropical Strings 7",
      descripcion: "La fiesta Crossover en un evento es la cereza del pastel con la que todo evento debe cerrar una gran celebración. Fusión de Champeta, Salsa, Reggaetón y Merengue. 7 integrantes.",
      horas: 2,
      precio: 7000000,
      categoria: "banda"
    },
    {
      id: "f-tropical-9",
      nombre: "Tropical Strings 9",
      descripcion: "La fiesta Crossover en un evento es la cereza del pastel con la que todo evento debe cerrar una gran celebración. Fusión de Champeta, Salsa, Reggaetón y Merengue. 9 integrantes.",
      horas: 2,
      precio: 9000000,
      categoria: "banda"
    }
  ],

  iluminacion: [
    {
      id: "il-basica",
      nombre: "Sonido e Iluminación Básica",
      descripcion: "Incluido siempre en todos los planes",
      precio: 3500000,

    },
    {
      id: "il-booth-herbal",
      nombre: "Booth Herbal para DJ",
      descripcion: "Booth herbal con decoración natural para DJ",
      precio: 500000
    },
    {
      id: "il-booth-led3",
      nombre: "Booth Pantalla LED para DJ",
      descripcion: "Booth con pantalla LED para DJ",
      precio: 1500000
    },
    {
      id: "il-booth-led6",
      nombre: "Booth Pantalla LED + 4 Lágrimas (6mts)",
      descripcion: "Booth pantalla LED y 4 lágrimas (6 mts)",
      precio: 2800000
    },
    {
      id: "il-booth-led8",
      nombre: "Booth Pantalla LED + 4 Cuadros LED (8mts)",
      descripcion: "Booth pantalla LED, 4 cuadros LED y fondo negro con estructura truss (8 mts)",
      precio: 3600000
    },
    {
      id: "il-booth-led12",
      nombre: "Booth Pantalla LED (12mts)",
      descripcion: "Booth pantalla LED (12 mts)",
      precio: 5000000
    },
    {
      id: "il-polvora-2",
      nombre: "Pólvora Fría x 2",
      descripcion: "Efectos de pólvora fría para momentos especiales (x2)",
      precio: 300000
    },
    {
      id: "il-polvora-4",
      nombre: "Pólvora Fría x 4",
      descripcion: "Efectos de pólvora fría para momentos especiales (x4)",
      precio: 500000
    },
    {
      id: "il-niebla",
      nombre: "Niebla Baja",
      descripcion: "Efectos de niebla baja",
      precio: 700000
    }
  ]
};

// Etiquetas de momentos
const MOMENT_LABELS = {
  ceremonia:   "Ceremonia",
  coctel:      "Cóctel",
  protocolo:   "Protocolo",
  cena:        "Cena",
  fiesta:      "Fiesta",
  iluminacion: "Audio e Iluminación"
};

const MOMENT_ICONS = {
  ceremonia:   "🎻",
  coctel:      "🥂",
  protocolo:   "🎩",
  cena:        "🍽",
  fiesta:      "🎉",
  iluminacion: "🎧💡"
};

const MOMENT_ORDER = ["ceremonia","coctel","protocolo","cena","fiesta","iluminacion"];