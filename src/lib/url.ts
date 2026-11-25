/** Every route ends in a slash (`trailingSlash: 'always'` in production). */
export const withTrailingSlash = (path: string) => (path.endsWith('/') ? path : `${path}/`);
