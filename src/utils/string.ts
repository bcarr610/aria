export const toPascal = (input: string): string => {
  const clean = input.toLowerCase().trim();
  return clean[0].toUpperCase() + clean.slice(1);
};
