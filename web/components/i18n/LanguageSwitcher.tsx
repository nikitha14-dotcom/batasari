"use client";
import { useLanguage, LANGUAGES } from "./LanguageProvider";
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  return <label style={{display:"inline-flex",alignItems:"center",gap:7,color:"#315440",fontSize:12,fontWeight:650,whiteSpace:"nowrap"}}>
    {!compact && <span>{t("language")}</span>}
    <select aria-label={t("language")} value={language} onChange={e=>setLanguage(e.target.value as typeof language)} style={{minHeight:36,maxWidth:compact?130:190,border:"1px solid #cad8cc",borderRadius:9,background:"#fff",color:"#20392b",padding:"6px 9px",font:"inherit"}}>
      {LANGUAGES.map(item=><option key={item.code} value={item.code}>{item.native}</option>)}
    </select>
  </label>;
}