import { ui, defaultLang, routes, showDefaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return key in ui[lang] ? (ui[lang] as any)[key] : ui[defaultLang][key];
  };
}

export function useTranslatedPath(lang: keyof typeof ui) {
  return function translatePath(path: string, l: string = lang) {
    const pathName = path.replaceAll('/', '');
    const hasTranslation =
      routes[l as keyof typeof routes] !== undefined &&
      routes[l as keyof typeof routes][
        pathName as keyof (typeof routes)[keyof typeof routes]
      ] !== undefined;
    const translatedPath = hasTranslation
      ? '/' +
        routes[l as keyof typeof routes][
          pathName as keyof (typeof routes)[keyof typeof routes]
        ]
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
