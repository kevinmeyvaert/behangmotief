import { ui, defaultLang, routes } from './ui';
import { withTrailingSlash } from '@/lib/url';

type Language = keyof typeof ui;
type TranslationDictionary = (typeof ui)[typeof defaultLang];
export const localeToHreflang: Record<Language, string> = {
  en: 'en-US',
  nl: 'nl-BE',
};

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: Language) {
  const dictionary = ui[lang] as TranslationDictionary;
  return function t<Key extends keyof TranslationDictionary>(
    key: Key
  ): TranslationDictionary[Key] {
    return (dictionary[key] ?? ui[defaultLang][key]) as TranslationDictionary[Key];
  };
}

export function useTranslatedPath(lang: Language) {
  return function translatePath(path: string, l: Language = lang) {
    const pathName = path.replaceAll('/', '');
    const hasTranslation = routes[l]?.[pathName as keyof (typeof routes)[Language]] !== undefined;
    const translatedPath = hasTranslation
      ? '/' + routes[l][pathName as keyof (typeof routes)[Language]]
      : path;

    return withTrailingSlash(`/${l}${translatedPath}`);
  };
}

/** This page's path in another language, translating the route segment (archief ↔ archive). */
export function getLocalizedPath(url: URL, targetLang: Language) {
  const currentLang = getLangFromUrl(url);
  const [firstSegment, ...rest] = url.pathname
    .replace(`/${currentLang}`, '')
    .split('/')
    .filter(Boolean);
  if (!firstSegment) return `/${targetLang}/`;

  const routeKey = (Object.keys(routes[currentLang]) as (keyof (typeof routes)[Language])[])
    .find((key) => routes[currentLang][key] === firstSegment);
  const segment = routeKey ? routes[targetLang][routeKey] : firstSegment;
  return withTrailingSlash(`/${[targetLang, segment, ...rest].join('/')}`);
}

export function getAlternateUrls(url: URL, siteUrl: string) {
  return Object.fromEntries(
    (Object.keys(ui) as Language[]).map((lang) => [
      localeToHreflang[lang],
      `${siteUrl}${getLocalizedPath(url, lang)}`,
    ])
  );
}
