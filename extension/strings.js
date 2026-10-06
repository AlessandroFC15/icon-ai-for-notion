// The extension's own text, in the language Notion is shown in so the button matches its
// neighbours. English is the fallback for any other language.
const STRINGS = {
  en: {
    suggestIcon: "Suggest icon",
    tryAgain: "Try again",
    more: "More",
    noSuggestions: "Couldn't get suggestions.",
  },
  pt: {
    suggestIcon: "Sugerir ícone",
    tryAgain: "Tentar de novo",
    more: "Mais",
    noSuggestions: "Não foi possível obter sugestões.",
  },
  es: {
    suggestIcon: "Sugerir ícono",
    tryAgain: "Reintentar",
    more: "Más",
    noSuggestions: "No se pudieron obtener sugerencias.",
  },
};

function t(key) {
  return (STRINGS[notionLanguage()] ?? STRINGS.en)[key];
}
