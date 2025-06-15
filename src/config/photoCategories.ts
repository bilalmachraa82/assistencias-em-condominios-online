
export const PHOTO_CATEGORIES = {
  diagnostico: "Diagnóstico",
  progresso: "Durante a Intervenção",
  resultado: "Resultado Final",
} as const;

export type PhotoCategory = keyof typeof PHOTO_CATEGORIES;

export const VALID_PHOTO_CATEGORIES = Object.keys(PHOTO_CATEGORIES) as PhotoCategory[];

export const SUPPLIER_PHOTO_CATEGORIES: PhotoCategory[] = ['progresso', 'resultado'];
