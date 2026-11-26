import { useEffect } from "react";

// Adresse publique du site. À remplacer par le nom de domaine définitif
// (ex. https://www.sunuderma.sn) quand il sera acheté, ici et dans
// index.html, public/robots.txt et public/sitemap.xml.
export const SITE_URL = "https://aichatousysunu-derma.lovable.app";

const DEFAULT_DESCRIPTION =
  "Sunu Derma : analyse de peau par IA, téléconsultation dermatologique et produits skincare adaptés aux peaux africaines. Paiement Wave et Orange Money.";

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Titre, description et URL canonique propres à chaque page. */
export function usePageMeta(title: string, description: string = DEFAULT_DESCRIPTION, path?: string) {
  useEffect(() => {
    const fullTitle = title.includes("Sunu Derma") ? title : `${title} | Sunu Derma`;
    document.title = fullTitle;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", description);

    const url = `${SITE_URL}${path ?? window.location.pathname}`;
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }, [title, description, path]);
}
