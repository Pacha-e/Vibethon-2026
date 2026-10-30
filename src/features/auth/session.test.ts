import { describe, expect, it } from 'vitest';
import { isEafitEmail, normalizeEmail } from './session';

describe('isEafitEmail', () => {
  it('acepta correos @eafit.edu.co, sin importar mayúsculas ni espacios', () => {
    expect(isEafitEmail('ana.perez@eafit.edu.co')).toBe(true);
    expect(isEafitEmail('  JPerez1@EAFIT.EDU.CO ')).toBe(true);
  });

  it('rechaza otros dominios y variantes engañosas', () => {
    for (const bad of [
      '', 'ana', 'ana@gmail.com', 'ana@eafit.edu', 'ana@eafit.edu.co.evil.com',
      'ana@sub.eafit.edu.co', 'ana@eafit-edu.co', '@eafit.edu.co', 'ana @eafit.edu.co',
    ]) {
      expect(isEafitEmail(bad)).toBe(false);
    }
  });

  it('normaliza a minúsculas sin espacios', () => {
    expect(normalizeEmail('  Ana@EAFIT.edu.co ')).toBe('ana@eafit.edu.co');
  });
});
