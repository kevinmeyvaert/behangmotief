import { navigation } from './navigation';
import { homepage } from './homepage';
import { services } from './services';
import { album } from './album';
import { archive } from './archive';
import { common } from './common';
import { legal } from './legal';

export const ui = {
  en: {
    ...navigation.en,
    ...homepage.en,
    ...services.en,
    ...album.en,
    ...archive.en,
    ...common.en,
    ...legal.en,
  },
  nl: {
    ...navigation.nl,
    ...homepage.nl,
    ...services.nl,
    ...album.nl,
    ...archive.nl,
    ...common.nl,
    ...legal.nl,
  },
};