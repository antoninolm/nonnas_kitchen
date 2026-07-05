import { createContext, useState } from "react";
import en from "../i18n/en.json";
import it from "../i18n/it.json";

const dictionaries = { en, it };

function detectInitialLang() {
  return navigator.language?.toLowerCase().startsWith("it") ? "it" : "en";
}

export const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(detectInitialLang);

  function t(key) {
    return dictionaries[lang][key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
