export const random = (min: number, max: number, precision: number = 2): number => {
  return Number((Math.random() * (max - min) + min).toFixed(precision));
};
