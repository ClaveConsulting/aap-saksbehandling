'use client';

import { Brev, BrevMottaker, Signatur } from 'lib/types/types';

import { Alert } from 'components/alert/Alert';

/**
 * Erstatter `BrevbyggerBeta` fra `@navikt/aap-breveditor`, som ligger i et privat
 * NAV-registry denne forken ikke har tilgang til. Propene er med vilje identiske
 * med den eksterne komponenten, slik at kallstedet i SkriveBrev.tsx står urørt.
 */
export interface BrevbyggerBetaProps {
  brevmal: Brev;
  mottaker: BrevMottaker;
  saksnummer: string;
  onBrevChange: (brev: Brev) => void;
  logo: unknown;
  signatur: Signatur[];
  readonly: boolean;
}

export const BrevbyggerBeta = ({ readonly }: BrevbyggerBetaProps) => (
  <Alert variant="warning">
    Breveditoren er ikke tilgjengelig i dette miljøet, så brevet kan{' '}
    {readonly ? 'ikke vises' : 'verken vises eller redigeres'} her.
  </Alert>
);
