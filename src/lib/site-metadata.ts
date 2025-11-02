/**
 * Centralized site metadata for SEO and Schema.org structured data
 */

export const siteMetadata = {
  name: 'Behangmotief',
  url: 'https://behangmotief.be',
  description: {
    nl: 'Professionele muziek- en festivalfotografie door Kevin Meyvaert. Gevestigd in Gent, België.',
    en: 'Professional music and festival photography by Kevin Meyvaert. Based in Gent, Belgium.',
  },
  logo: '/profile.jpg',

  author: {
    name: 'Kevin Meyvaert',
    jobTitle: {
      nl: 'Muziek & Festivalfotograaf',
      en: 'Music & Festival Photographer',
    },
    bio: {
      nl: 'Belgische freelance muziek- en festivalfotograaf gevestigd in Gent. Deel van Wannabes, een rockfotografie collectief.',
      en: 'Belgian freelance music & festival photographer based in Gent. Part of Wannabes, a rockphotography collective.',
    },
    image: '/profile.jpg',
    email: 'hallo@behangmotief.be',
    location: {
      city: 'Gent',
      region: 'Oost-Vlaanderen',
      country: 'Belgium',
      countryCode: 'BE',
    },
  },

  business: {
    vatNumber: 'BE0548755031',
    type: 'ProfessionalService',
    priceRange: '$$',
    areaServed: {
      nl: 'België',
      en: 'Belgium',
    },
    services: [
      {
        nl: 'Festivalfotografie',
        en: 'Festival photography',
      },
      {
        nl: 'Concertfotografie',
        en: 'Concert photography',
      },
      {
        nl: 'Sociale media content',
        en: 'Social media content',
      },
      {
        nl: 'Workshops',
        en: 'Workshops',
      },
      {
        nl: 'Licenties',
        en: 'Licensing',
      },
      {
        nl: 'Persfotografie',
        en: 'Press photography',
      },
    ],
  },

  social: {
    instagram: 'https://instagram.com/behangmotief/',
  },

  clients: [
    'Democrazy',
    'Crammerock',
    'Studio Brussel',
    'Cactusfestival',
    'HEAR HEAR',
    'Pukkelpop',
    'Boomtown',
    'Gladiolen',
    'VI.BE',
    'Gent Jazz',
    'Muziekcentrum De Bijloke',
  ],
} as const;

/**
 * Generate Person schema for Kevin Meyvaert
 */
export function getPersonSchema(locale: 'nl' | 'en' = 'nl') {
  const { author, social } = siteMetadata;

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${siteMetadata.url}#person`,
    name: author.name,
    jobTitle: author.jobTitle[locale],
    description: author.bio[locale],
    image: `${siteMetadata.url}${author.image}`,
    url: siteMetadata.url,
    email: author.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: author.location.city,
      addressRegion: author.location.region,
      addressCountry: author.location.countryCode,
    },
    sameAs: [social.instagram],
  };
}

/**
 * Generate Organization/LocalBusiness schema for Behangmotief
 */
export function getOrganizationSchema(locale: 'nl' | 'en' = 'nl') {
  const { name, url, logo, author, business, social } = siteMetadata;

  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness', 'ProfessionalService'],
    '@id': `${url}#organization`,
    name,
    description: siteMetadata.description[locale],
    url,
    logo: `${url}${logo}`,
    image: `${url}${logo}`,
    email: author.email,
    telephone: undefined, // Can be added if available
    address: {
      '@type': 'PostalAddress',
      addressLocality: author.location.city,
      addressRegion: author.location.region,
      addressCountry: author.location.countryCode,
    },
    geo: {
      '@type': 'GeoCoordinates',
      addressCountry: author.location.countryCode,
    },
    areaServed: {
      '@type': 'Country',
      name: business.areaServed[locale],
    },
    vatID: business.vatNumber,
    founder: {
      '@type': 'Person',
      '@id': `${url}#person`,
      name: author.name,
    },
    sameAs: [social.instagram],
    priceRange: business.priceRange,
    serviceType: business.services.map(service => service[locale]),
  };
}

/**
 * Generate WebSite schema with search functionality
 */
export function getWebSiteSchema(locale: 'nl' | 'en' = 'nl') {
  const { name, url } = siteMetadata;

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${url}#website`,
    name,
    url,
    inLanguage: locale === 'nl' ? 'nl-BE' : 'en',
    publisher: {
      '@id': `${url}#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/${locale}/archive?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate ImageGallery schema for album pages
 */
export function getImageGallerySchema(
  albumData: {
    title: string;
    description?: string;
    date?: string;
    artist?: string;
    venue?: string;
    images: Array<{
      url: string;
      alt?: string;
      width?: number;
      height?: number;
    }>;
  },
  locale: 'nl' | 'en' = 'nl'
) {
  const { url, author } = siteMetadata;

  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: albumData.title,
    description: albumData.description,
    author: {
      '@type': 'Person',
      '@id': `${url}#person`,
      name: author.name,
    },
    creator: {
      '@type': 'Person',
      '@id': `${url}#person`,
      name: author.name,
    },
    copyrightHolder: {
      '@type': 'Person',
      '@id': `${url}#person`,
      name: author.name,
    },
    ...(albumData.date && { datePublished: albumData.date }),
    ...(albumData.artist && albumData.venue && {
      about: {
        '@type': 'Event',
        name: `${albumData.artist} at ${albumData.venue}`,
        performer: {
          '@type': 'MusicGroup',
          name: albumData.artist,
        },
        location: {
          '@type': 'Place',
          name: albumData.venue,
        },
        ...(albumData.date && { startDate: albumData.date }),
      },
    }),
    image: albumData.images.slice(0, 10).map((img) => ({
      '@type': 'Photograph',
      contentUrl: img.url,
      creator: {
        '@type': 'Person',
        '@id': `${url}#person`,
        name: author.name,
      },
      copyrightHolder: {
        '@type': 'Person',
        '@id': `${url}#person`,
        name: author.name,
      },
      ...(img.alt && { caption: img.alt }),
      ...(img.width && img.height && {
        width: img.width,
        height: img.height,
      }),
    })),
  };
}

/**
 * Generate CollectionPage schema for archive page
 */
export function getCollectionPageSchema(locale: 'nl' | 'en' = 'nl') {
  const { url, name } = siteMetadata;

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: locale === 'nl' ? 'Archief - Behangmotief' : 'Archive - Behangmotief',
    description:
      locale === 'nl'
        ? 'Volledige collectie muziek- en festivalfoto\'s door Kevin Meyvaert'
        : 'Complete collection of music and festival photography by Kevin Meyvaert',
    url: `${url}/${locale}/archive`,
    mainEntity: {
      '@type': 'ImageGallery',
      author: {
        '@type': 'Person',
        '@id': `${url}#person`,
      },
    },
    isPartOf: {
      '@id': `${url}#website`,
    },
  };
}

/**
 * Generate ProfessionalService schema for homepage
 */
export function getProfessionalServiceSchema(locale: 'nl' | 'en' = 'nl') {
  const { url, business, author } = siteMetadata;

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${url}#service`,
    name: siteMetadata.name,
    description: siteMetadata.description[locale],
    provider: {
      '@id': `${url}#organization`,
    },
    serviceType: business.services.map(service => service[locale]),
    areaServed: {
      '@type': 'Country',
      name: business.areaServed[locale],
    },
    priceRange: business.priceRange,
    image: `${url}${author.image}`,
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function getBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url: string }>,
  locale: 'nl' | 'en' = 'nl'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
