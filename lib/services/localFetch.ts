import { cookies } from 'next/headers';

const DEFAULT_BRUKER = 'VEILEDER';

const ROLLER = ['saksbehandler-rolle', 'veileder-rolle', 'kvalitetssikrer-rolle', 'beslutter-rolle'];

const base64url = (json: object) => Buffer.from(JSON.stringify(json)).toString('base64url');

/**
 * Signaturen blir aldri verifisert lokalt, men den må være til stede: nimbus sin
 * JWTParser.parse (brukt av TexasFake ved OBO-veksling) kaster
 * "The signature must not be empty" og gir 500 på endepunkt som veksler token,
 * f.eks. GET /api/sak/{saksnummer}/personinformasjon.
 *
 * Verdien er konstant slik at samme ident alltid gir samme token, og backend sin
 * OBO-cache treffer istedenfor å veksle på nytt for hver request.
 */
const SIGNATUR = Buffer.from('lokal-utvikling-signatur-verifiseres-ikke').toString('base64url');

/**
 * Lager et lokalt token uten å kontakte noen sentral tjeneste.
 *
 * Kelvin-backendene validerer med TexasAuthenticationProvider, som kjører `JWT.decode`
 * (dekoding, ikke signatursjekk) og deretter spør Texas om tokenet er aktivt. Lokalt er
 * Texas erstattet av TexasFake, som alltid svarer `{"active": true}`. Verken signaturen
 * eller `exp` blir verifisert, så tokenet under utløper ikke i praksis. Signaturen må
 * likevel være til stede - se SIGNATUR over.
 *
 * Brukes kun når NEXT_PUBLIC_ENVIRONMENT=localhost; se isLocal() i getToken.
 */
export async function hentLocalToken(scope: string) {
  const cookieStore = await cookies();
  const lagretIdent = cookieStore.get('bruker');
  const ident = lagretIdent?.value || DEFAULT_BRUKER;

  if (!lagretIdent) {
    try {
      cookieStore.set({ name: 'bruker', value: DEFAULT_BRUKER });
    } catch {
      // cookies() er read-only under render av en page. Identen faller tilbake til DEFAULT_BRUKER.
    }
  }

  const header = { alg: 'RS256', typ: 'JWT', kid: 'localhost-signer' };
  const claims = {
    iss: 'behandlingsflyt',
    aud: scope,
    sub: 'lokal-utvikling',
    exp: 2000000000,
    NAVident: ident,
    groups: ROLLER,
  };

  return `${base64url(header)}.${base64url(claims)}.${SIGNATUR}`;
}
