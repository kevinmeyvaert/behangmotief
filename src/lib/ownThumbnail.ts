import type { Post } from "@/types/wannabes.types";


export const checkThumbnails = (album: Post) => {
  if (album.thumbnail.photographer?.firstName !== 'Kevin') {
    const kevThumbnail = album.images.filter(
      (i) => i.photographer?.firstName === 'Kevin'
    )[0];
    return {
      ...album,
      thumbnail: {
        dimensions: album.thumbnail.dimensions,
        blurhash: kevThumbnail.blurhash,
        hires: kevThumbnail.resized,
      },
    };
  } else {
    return album;
  }
};
