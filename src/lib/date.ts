/** API dates are `YYYY-MM-DD`; rearranging the string keeps the server's timezone out of it. */
export const formatPostDate = (date: string) => date.split('-').reverse().join('/');
