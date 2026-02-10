import { ui, defaultLang, routes } from './ui';

type Language = keyof typeof ui;
type TranslationDictionary = (typeof ui)[typeof defaultLang];

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

    return `/${l}${translatedPath}`;
  };
}

export function getAlternateUrls(url: URL, siteUrl: string) {
  const currentLang = getLangFromUrl(url);
  const pathname = url.pathname;

  // Remove the current locale from the pathname
  const pathWithoutLocale = pathname.replace(`/${currentLang}`, '');

  // Parse the path to identify route segments
  const pathSegments = pathWithoutLocale.split('/').filter(Boolean);

  // Generate URLs for all languages
  const alternates: Record<string, string> = {};

  Object.keys(ui).forEach((lang) => {
    const typedLang = lang as keyof typeof ui;

    if (pathSegments.length === 0) {
      // Homepage
      alternates[lang] = `${siteUrl}/${lang}`;
    } else {
      // Check if the first segment is a translatable route
      const firstSegment = pathSegments[0];
      const currentRoutes = routes[currentLang];
      const targetRoutes = routes[typedLang];

      let translatedPath = pathWithoutLocale;

      // Find if the first segment matches a translated route
      const routeKey = Object.keys(currentRoutes).find(
        (key) => currentRoutes[key as keyof typeof currentRoutes] === firstSegment
      );

      if (routeKey) {
        // Replace the first segment with its translation
        const translatedSegment = targetRoutes[routeKey as keyof typeof targetRoutes];
        const restOfPath = pathSegments.slice(1).join('/');
        translatedPath = `/${translatedSegment}${restOfPath ? '/' + restOfPath : ''}`;
      }

      alternates[lang] = `${siteUrl}/${lang}${translatedPath}`;
    }
  });

  return alternates;
}
