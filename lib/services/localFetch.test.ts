import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hentLocalToken } from './localFetch';
import { cookies } from 'next/headers';

vi.mock('next/headers');
vi.mock('lib/serverutlis/logger');
vi.mock('server-only', () => {
  return {};
});

global.fetch = vi.fn();

const mockScope = 'dev-gcp:aap:behandlingsflyt';

const mockCookies = (lagretIdent?: string) => {
  const set = vi.fn();
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn().mockReturnValue(lagretIdent ? { name: 'bruker', value: lagretIdent } : undefined),
    set,
  } as unknown as Awaited<ReturnType<typeof cookies>>);
  return set;
};

const decode = (segment: string) => JSON.parse(Buffer.from(segment, 'base64url').toString());

describe('hentLocalToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies();
  });

  it('lager et token uten å kontakte nettverket', async () => {
    await hentLocalToken(mockScope);

    expect(fetch).not.toHaveBeenCalled();
  });

  it('lager et token med tre deler som backend kan dekode', async () => {
    const token = await hentLocalToken(mockScope);

    // TexasAuthenticationProvider kjører JWT.decode, som krever tre deler.
    expect(token.split('.')).toHaveLength(3);
    expect(() => decode(token.split('.')[0])).not.toThrow();
    expect(() => decode(token.split('.')[1])).not.toThrow();
  });

  it('har en ikke-tom signatur, ellers feiler OBO-veksling i TexasFake', async () => {
    // Backend har to JWT-lesere med ulike krav:
    //   - auth0 JWT.decode (autentisering) godtar tom signatur
    //   - nimbus JWTParser.parse (OBO-veksling via token()) kaster
    //     "The signature must not be empty" og gir 500 på f.eks.
    //     GET /api/sak/{saksnummer}/personinformasjon
    const signatur = (await hentLocalToken(mockScope)).split('.')[2];

    expect(signatur.length).toBeGreaterThan(0);
  });

  it('lager identiske token for samme ident, slik at backend sin OBO-cache treffer', async () => {
    const første = await hentLocalToken(mockScope);
    const andre = await hentLocalToken(mockScope);

    expect(første).toBe(andre);
  });

  it('setter scope som audience og default-ident som NAVident', async () => {
    const token = await hentLocalToken(mockScope);
    const claims = decode(token.split('.')[1]);

    expect(claims.aud).toBe(mockScope);
    expect(claims.NAVident).toBe('VEILEDER');
    expect(claims.groups).toContain('saksbehandler-rolle');
  });

  it('bruker identen fra bruker-cookien når den er satt', async () => {
    mockCookies('Z999999');

    const claims = decode((await hentLocalToken(mockScope)).split('.')[1]);

    expect(claims.NAVident).toBe('Z999999');
  });

  it('setter bruker-cookien til default når den mangler', async () => {
    const set = mockCookies();

    await hentLocalToken(mockScope);

    expect(set).toHaveBeenCalledWith({ name: 'bruker', value: 'VEILEDER' });
  });

  it('faller tilbake til default-ident når cookies er read-only under render', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn().mockImplementation(() => {
        throw new Error('Cookies can only be modified in a Server Action or Route Handler');
      }),
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    const claims = decode((await hentLocalToken(mockScope)).split('.')[1]);

    expect(claims.NAVident).toBe('VEILEDER');
  });
});
