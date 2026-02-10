import type { AlbumPost } from '@/types/components';

const isKevinPhoto = (photographer?: { firstName: string }) =>
  photographer?.firstName === 'Kevin';

export const checkThumbnails = (album: AlbumPost): AlbumPost => {
  if (isKevinPhoto(album.thumbnail.photographer)) {
    return album;
  }

  const kevinImage = album.images.find((image) =>
    isKevinPhoto(image.photographer)
  );

  if (!kevinImage) {
    return album;
  }

  return {
    ...album,
    thumbnail: {
      ...album.thumbnail,
      blurhash: kevinImage.blurhash,
      hires: kevinImage.resized,
    },
  };
};
