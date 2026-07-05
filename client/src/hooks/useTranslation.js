import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

export function useTranslation() {
  return useContext(LanguageContext);
}
