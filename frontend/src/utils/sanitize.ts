import DOMPurify from 'dompurify';

/**
 * Sanitização production-grade usando DOMPurify
 * Protege contra XSS, SVG injection, atributos perigosos, etc.
 */
export function sanitize(input: string): string {
  // Remove TODAS as tags HTML e atributos perigosos
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Nenhuma tag HTML permitida
    ALLOWED_ATTR: [], // Nenhum atributo permitido
    KEEP_CONTENT: true, // Mantém o texto interno
  }).trim();
}

/**
 * Sanitiza objeto recursivamente
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result = {} as T;
  
  for (const key in obj) {
    const value = obj[key];
    
    if (typeof value === 'string') {
      result[key] = sanitize(value) as any;
    } else if (Array.isArray(value)) {
      result[key] = value.map((item: any) => 
        typeof item === 'string' ? sanitize(item) : item
      ) as any;
    } else {
      result[key] = value;
    }
  }
  
  return result;
}
