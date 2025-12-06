import { gql } from 'graphql-request';

export const POSTS = gql`
  query Search($start: Int, $limit: Int, $all: String) {
    posts: postSearch(
      photographerSlug: "kevin-meyvaert"
      start: $start
      limit: $limit
      all: $all
    ) {
      data {
        id
        artist {
          name
        }
        date
        slug
        images {
          blurhash
          photographer {
            firstName
          }
          resized(width: 1200, height: 800)
        }
        thumbnail {
          blurhash
          hires
          photographer {
            firstName
          }
          dimensions {
            width
            height
          }
        }
        venue {
          id
          name
        }
        event {
          name
        }
      }
      pagination {
        start
        limit
        total
      }
    }
  }
`;

export const ALBUM = gql`
  query Album($slug: String) {
    post(slug: $slug) {
      date
      thumbnail {
        resized(width: 1200, height: 800)
        photographer {
          firstName
        }
      }
      id
      url
      artist {
        name
        slug
      }
      venue {
        name
        slug
      }
      event {
        name
      }
      images {
        blurhash
        hires
        id
        dimensions {
          width
          height
        }
        photographer {
          firstName
        }
      }
    }
  }
`;

export const RELATED_ALBUMS = gql`
  query relatedPosts($artistSlug: String, $venueSlug: String) {
    sameArtist: postSearch(
      artistSlug: $artistSlug
      limit: 5
      random: true
      photographerSlug: "kevin-meyvaert"
    ) {
      data {
        ...relatedPostFields
      }
    }
    sameVenue: postSearch(
      venueSlug: $venueSlug
      limit: 5
      random: true
      photographerSlug: "kevin-meyvaert"
    ) {
      data {
        ...relatedPostFields
      }
    }
  }

  fragment relatedPostFields on Post {
    id
    slug
    venue {
      name
    }
    artist {
      name
    }
    thumbnail {
      hires
      blurhash
      photographer {
        firstName
      }
      dimensions {
        width
        height
      }
    }
    images {
      blurhash
      photographer {
        firstName
      }
      resized(width: 1200, height: 800)
    }
    date
    event {
      name
    }
  }
`;
