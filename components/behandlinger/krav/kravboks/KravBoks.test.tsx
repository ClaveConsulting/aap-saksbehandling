import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { KravVurdering, RelevantKrav, SøknadUtenKrav } from 'lib/types/types';
import { customRender } from 'lib/test/CustomRender';
import { byggInitielleVurderinger } from 'components/behandlinger/krav/kravutils';
import { KravBoks, KravBoksInnhold } from 'components/behandlinger/krav/kravboks/KravBoks';
import { KravFormFields } from 'components/behandlinger/krav/vurderkrav/VurderKrav';

const user = userEvent.setup();

function relevantKrav(overrides: Partial<RelevantKrav> = {}): RelevantKrav {
  return {
    type: 'RELEVANT_KRAV',
    referanse: 'krav-1',
    journalpostId: { identifikator: 'jp-1' },
    begrunnelse: 'Opprinnelig begrunnelse',
    opprettet: '2025-04-01T10:30:00Z',
    muligRettFra: '2025-04-15',
    søknadsdato: { dato: '2025-04-01', årsak: 'SøknadMottatt', begrunnelse: '' },
    vurdertAv: 'Z000000',
    vurdertIBehandling: { id: 1 },
    ...overrides,
  };
}

function annenKravtypeKrav(
  type: 'KLAGE' | 'TILLEGGSOPPLYSNING' | 'TRUKKET_SØKNAD',
  overrides: Partial<KravVurdering> = {}
): KravVurdering {
  return {
    type,
    referanse: 'krav-2',
    journalpostId: { identifikator: 'jp-2' },
    begrunnelse: 'Opprinnelig begrunnelse',
    opprettet: '2025-04-01T10:30:00Z',
    vurdertAv: 'Z000000',
    vurdertIBehandling: { id: 1 },
    ...overrides,
  };
}

function søknadUtenKrav(overrides: Partial<SøknadUtenKrav> = {}): SøknadUtenKrav {
  return {
    journalpostId: { identifikator: 'jp-ny' },
    mottattTidspunkt: '2025-05-10T09:00:00',
    ...overrides,
  };
}

function KravBoksWrapper({ innhold, onLukk = vi.fn() }: { innhold: KravBoksInnhold; onLukk?: () => void }) {
  const referanse =
    innhold.kilde === 'EKSISTERENDE' ? innhold.krav.referanse : innhold.søknad.journalpostId.identifikator;
  const vurdering = innhold.kilde === 'EKSISTERENDE' ? innhold.krav : undefined;
  const søknad = innhold.kilde === 'NY_SØKNAD' ? innhold.søknad : undefined;

  const form = useForm<KravFormFields>({
    defaultValues: {
      valgteKrav: [referanse],
      vurderinger: byggInitielleVurderinger({
        harTilgangTilÅSaksbehandle: true,
        nyeVurderinger: vurdering ? [vurdering] : [],
        vedtatteVurderinger: [],
        søknader: [],
        søknaderUtenKravvurdering: søknad ? [søknad] : [],
      }),
    },
  });

  return (
    <FormProvider {...form}>
      <KravBoks innhold={innhold} erVedtatt={false} onLukk={onLukk} />
    </FormProvider>
  );
}

describe('KravBoks', () => {
  it('viser krav-referanse, søknadsdato og kravtype for et eksisterende krav', () => {
    const krav = relevantKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    expect(screen.getByText('Vurder krav krav-1')).toBeVisible();
    expect(screen.getByText('Søknadsdato: 01.04.2025')).toBeVisible();
    expect(screen.getAllByText('Relevant krav').length).toBeGreaterThan(0);
    expect(screen.queryByText('Må vurderes')).not.toBeInTheDocument();
  });

  it('viser "Må vurderes"-tag og "Ny søknad"-tittel for en søknad uten kravvurdering', () => {
    const søknad = søknadUtenKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'NY_SØKNAD', søknad }} />);

    expect(screen.getByText('Ny søknad jp-ny')).toBeVisible();
    expect(screen.getByText('Må vurderes')).toBeVisible();
    expect(screen.getByText('Søknadsdato: 10.05.2025')).toBeVisible();
  });

  it('viser "-" for mulig rett fra når kravet ikke har et slikt felt (f.eks. en ny søknad)', async () => {
    const søknad = søknadUtenKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'NY_SØKNAD', søknad }} />);

    await user.click(screen.getByRole('radio', { name: 'Ja' }));

    expect(screen.getByText('-')).toBeVisible();
  });
});

describe('KravBoks - åpne/lukke bolker', () => {
  it('åpner Kravtype-bolken ved klikk, og viser Ja/Nei-valget for om kravet er relevant', async () => {
    const krav = relevantKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    expect(screen.queryByRole('radio', { name: 'Ja' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Vurder om krav er relevant' }));

    expect(screen.getByRole('radio', { name: 'Ja' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Ja' })).toBeChecked();
  });

  it('viser Kravtype-bolken forhåndsåpnet for en ny søknad, uten at Ja/Nei-valget er forhåndsutfylt', () => {
    const søknad = søknadUtenKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'NY_SØKNAD', søknad }} />);

    expect(screen.getByRole('radio', { name: 'Ja' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Nei' })).not.toBeChecked();
    expect(screen.queryByRole('button', { name: 'Avbryt vurder om krav er relevant' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Vurder om krav er relevant' })).not.toBeInTheDocument();
  });

  it('viser Kravtype-bolken lukket for et eksisterende krav (skal ikke forhåndsåpnes)', () => {
    const krav = relevantKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    expect(screen.queryByRole('combobox', { name: 'Kravtype' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vurder om krav er relevant' })).toBeVisible();
  });

  it('nullstiller Ja/Nei-valget til opprinnelig verdi når bolken lukkes igjen uten å lagre', async () => {
    const krav = relevantKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    await user.click(screen.getByRole('button', { name: 'Vurder om krav er relevant' }));
    expect(screen.getByRole('radio', { name: 'Ja' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Nei' }));
    expect(screen.getByRole('radio', { name: 'Nei' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Avbryt vurder om krav er relevant' }));

    await user.click(screen.getByRole('button', { name: 'Vurder om krav er relevant' }));
    expect(screen.getByRole('radio', { name: 'Ja' })).toBeChecked();
  });

  it('nullstiller søknadsdato-feltene til opprinnelig verdi når bolken lukkes igjen uten å lagre', async () => {
    const krav = relevantKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    await user.click(screen.getByRole('button', { name: 'Vurder § 22-13 femte ledd' }));
    await user.click(
      screen.getByRole('radio', { name: 'Ja, bruker har søkt tidligere enn første registrerte søknad' })
    );
    const søknadsdatoFelt = screen.getByRole('textbox', { name: 'Ny søknadsdato' });
    await user.clear(søknadsdatoFelt);
    await user.type(søknadsdatoFelt, '15.06.2025');
    expect(søknadsdatoFelt).toHaveValue('15.06.2025');

    await user.click(screen.getByRole('button', { name: 'Avbryt Vurder § 22-13 femte ledd' }));
    await user.click(screen.getByRole('button', { name: 'Vurder § 22-13 femte ledd' }));

    expect(screen.getByRole('radio', { name: 'Nei' })).toBeChecked();
    expect(screen.queryByRole('textbox', { name: 'Ny søknadsdato' })).not.toBeInTheDocument();
  });

  it('nullstiller overstyr mulig rett fra til opprinnelig verdi når bolken lukkes igjen uten å lagre', async () => {
    const krav = relevantKrav({
      overstyrMuligRettFra: {
        dato: '2025-07-01',
        årsak: 'MisvisendeOpplysninger',
        begrunnelse: 'Feil informasjon fra Nav',
      },
    });
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    await user.click(screen.getByRole('button', { name: 'Vurder § 22-13 syvende ledd' }));
    const overstyrFelt = screen.getByRole('textbox', { name: 'Brukeren har tidligst rett på AAP fra' });
    expect(overstyrFelt).toHaveValue('01.07.2025');

    await user.clear(overstyrFelt);
    await user.type(overstyrFelt, '20.08.2025');
    expect(overstyrFelt).toHaveValue('20.08.2025');

    await user.click(screen.getByRole('button', { name: 'Avbryt vurder § 22-13 syvende ledd' }));
    await user.click(screen.getByRole('button', { name: 'Vurder § 22-13 syvende ledd' }));

    expect(screen.getByRole('textbox', { name: 'Brukeren har tidligst rett på AAP fra' })).toHaveValue('01.07.2025');
  });
});

describe('KravBoks - Lukk-knapp og begrunnelse', () => {
  it('kaller onLukk når toppnivå Lukk-knappen klikkes', async () => {
    const onLukk = vi.fn();
    const krav = relevantKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} onLukk={onLukk} />);

    await user.click(screen.getByRole('button', { name: 'Lukk' }));

    expect(onLukk).toHaveBeenCalledOnce();
  });

  it('viser begrunnelsesfeltet (Vurdering) forhåndsutfylt med eksisterende begrunnelse for et allerede vurdert krav', async () => {
    const krav = relevantKrav({ begrunnelse: 'En begrunnelse fra før' });
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    await user.click(screen.getByRole('button', { name: 'Vurder om krav er relevant' }));

    expect(screen.getByRole('textbox', { name: 'Vurdering' })).toHaveValue('En begrunnelse fra før');
  });

  it('viser tomt Vurdering-felt for en ny søknad uten kravvurdering', () => {
    const søknad = søknadUtenKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'NY_SØKNAD', søknad }} />);

    expect(screen.getByRole('textbox', { name: 'Vurdering' })).toHaveValue('');
  });
});

describe('KravBoks - §22-13-bolker vises kun for relevant krav', () => {
  it('viser knappene for §22-13 femte og syvende ledd for et eksisterende krav av typen relevant krav', () => {
    const krav = relevantKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    expect(screen.getByRole('button', { name: 'Vurder § 22-13 femte ledd' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Vurder § 22-13 syvende ledd' })).toBeVisible();
  });

  it('skjuler knappene for §22-13 femte og syvende ledd for en ny søknad før Ja/Nei-valget er besvart', async () => {
    const søknad = søknadUtenKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'NY_SØKNAD', søknad }} />);

    expect(screen.queryByRole('button', { name: 'Vurder § 22-13 femte ledd' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Vurder § 22-13 syvende ledd' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Ja' }));

    expect(screen.getByRole('button', { name: 'Vurder § 22-13 femte ledd' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Vurder § 22-13 syvende ledd' })).toBeVisible();
  });

  it.each([['KLAGE'], ['TILLEGGSOPPLYSNING'], ['TRUKKET_SØKNAD']] as const)(
    'skjuler §22-13 femte og syvende ledd-bolkene for et eksisterende krav av typen %s',
    (type) => {
      const krav = annenKravtypeKrav(type);
      customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

      expect(screen.queryByRole('button', { name: 'Vurder § 22-13 femte ledd' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Vurder § 22-13 syvende ledd' })).not.toBeInTheDocument();
    }
  );

  it('skjuler §22-13-bolkene med det samme kravtypen endres bort fra relevant krav via Ja/Nei-valget', async () => {
    const krav = relevantKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    expect(screen.getByRole('button', { name: 'Vurder § 22-13 femte ledd' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Vurder § 22-13 syvende ledd' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Vurder om krav er relevant' }));
    await user.click(screen.getByRole('radio', { name: 'Nei' }));

    expect(screen.queryByRole('button', { name: 'Vurder § 22-13 femte ledd' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Vurder § 22-13 syvende ledd' })).not.toBeInTheDocument();
  });

  it('viser §22-13-bolkene igjen når kravtypen endres tilbake til relevant krav', async () => {
    const krav = annenKravtypeKrav('KLAGE');
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    expect(screen.queryByRole('button', { name: 'Vurder § 22-13 femte ledd' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Vurder om krav er relevant' }));
    expect(screen.getByRole('radio', { name: 'Nei' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Ja' }));

    expect(screen.getByRole('button', { name: 'Vurder § 22-13 femte ledd' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Vurder § 22-13 syvende ledd' })).toBeVisible();
  });

  it('skjuler feltene inni en allerede åpen §22-13 femte ledd-bolk når kravtypen endres bort fra relevant krav', async () => {
    const krav = relevantKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    await user.click(screen.getByRole('button', { name: 'Vurder § 22-13 femte ledd' }));
    await user.click(
      screen.getByRole('radio', { name: 'Ja, bruker har søkt tidligere enn første registrerte søknad' })
    );
    expect(screen.getByRole('textbox', { name: 'Ny søknadsdato' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Vurder om krav er relevant' }));
    // Flere radioknapper heter nå "Nei" (kravtype-, søknadsdato- og mulig rett fra-gruppene),
    // så vi må velge den første som hører til "Skal brukeren vurderes...?"-gruppen.
    await user.click(screen.getAllByRole('radio', { name: 'Nei' })[0]);

    expect(screen.queryByRole('textbox', { name: 'Ny søknadsdato' })).not.toBeInTheDocument();
  });
});

describe('KravBoks - §22-13 femte ledd (Skal brukerens søknadsdato endres?)', () => {
  it('skjuler datofelt og infoalert som standard (søknadsdatoEndres=Nei)', async () => {
    const krav = relevantKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    await user.click(screen.getByRole('button', { name: 'Vurder § 22-13 femte ledd' }));

    expect(screen.getByRole('radio', { name: 'Nei' })).toBeChecked();
    expect(screen.queryByRole('textbox', { name: 'Ny søknadsdato' })).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'Husk å journalføre relevant dokument som dokumenterer riktig søknadsdato til AAP-saken. Endret søknadsdato gir ikke krav på renter.'
      )
    ).not.toBeInTheDocument();
  });

  it.each([
    ['Ja, bruker har søkt tidligere enn første registrerte søknad'],
    ['Ja, søknadsdato er feilregistrert'],
  ] as const)('viser nytt datofelt og infoalert når svaret er "%s"', async (svar) => {
    const krav = relevantKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    await user.click(screen.getByRole('button', { name: 'Vurder § 22-13 femte ledd' }));
    await user.click(screen.getByRole('radio', { name: svar }));

    expect(screen.getByRole('textbox', { name: 'Ny søknadsdato' })).toBeVisible();
    expect(
      screen.getByText(
        'Husk å journalføre relevant dokument som dokumenterer riktig søknadsdato til AAP-saken. Endret søknadsdato gir ikke krav på renter.'
      )
    ).toBeVisible();
  });

  it('skjuler datofelt og infoalert igjen når svaret endres tilbake til Nei', async () => {
    const krav = relevantKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    await user.click(screen.getByRole('button', { name: 'Vurder § 22-13 femte ledd' }));
    await user.click(screen.getByRole('radio', { name: 'Ja, søknadsdato er feilregistrert' }));
    expect(screen.getByRole('textbox', { name: 'Ny søknadsdato' })).toBeVisible();

    await user.click(screen.getByRole('radio', { name: 'Nei' }));

    expect(screen.queryByRole('textbox', { name: 'Ny søknadsdato' })).not.toBeInTheDocument();
  });

  it('krever begrunnelse for §22-13 femte ledd uansett hvilket Ja/Nei-svar som er valgt', async () => {
    const krav = relevantKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    await user.click(screen.getByRole('button', { name: 'Vurder § 22-13 femte ledd' }));

    const [begrunnelsesfelt] = screen.getAllByRole('textbox', { name: 'Begrunnelse' });
    expect(begrunnelsesfelt).toHaveValue('');
  });
});

describe('KravBoks - §22-13 syvende ledd (Skal brukerens rett på ytelse tilbakedateres?)', () => {
  it('skjuler datofelt og warningalert som standard (muligRettFraTilbakedateres=Nei)', async () => {
    const krav = relevantKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    await user.click(screen.getByRole('button', { name: 'Vurder § 22-13 syvende ledd' }));

    expect(screen.getByRole('radio', { name: 'Nei' })).toBeChecked();
    expect(screen.queryByRole('textbox', { name: 'Brukeren har tidligst rett på AAP fra' })).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'Det er ikke støtte for beregning av renter i Kelvin ennå. Følg samme rutine som brukes på Arena-saker (via Gosys).'
      )
    ).not.toBeInTheDocument();
  });

  it.each([
    ['Ja, brukeren har åpenbart ikke vært i stand til å sette fram krav tidligere'],
    ['Ja, brukeren har ikke satt fram krav tidligere fordi trygdens organer har gitt misvisende opplysninger'],
  ] as const)('viser datofelt og warningalert når svaret er "%s"', async (svar) => {
    const krav = relevantKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    await user.click(screen.getByRole('button', { name: 'Vurder § 22-13 syvende ledd' }));
    await user.click(screen.getByRole('radio', { name: svar }));

    expect(screen.getByRole('textbox', { name: 'Brukeren har tidligst rett på AAP fra' })).toBeVisible();
    expect(
      screen.getByText(
        'Det er ikke støtte for beregning av renter i Kelvin ennå. Følg samme rutine som brukes på Arena-saker (via Gosys).'
      )
    ).toBeVisible();
  });

  it('skjuler datofelt og warningalert igjen når svaret endres tilbake til Nei', async () => {
    const krav = relevantKrav();
    customRender(<KravBoksWrapper innhold={{ kilde: 'EKSISTERENDE', krav }} />);

    await user.click(screen.getByRole('button', { name: 'Vurder § 22-13 syvende ledd' }));
    await user.click(
      screen.getByRole('radio', { name: 'Ja, brukeren har åpenbart ikke vært i stand til å sette fram krav tidligere' })
    );
    expect(screen.getByRole('textbox', { name: 'Brukeren har tidligst rett på AAP fra' })).toBeVisible();

    await user.click(screen.getByRole('radio', { name: 'Nei' }));

    expect(screen.queryByRole('textbox', { name: 'Brukeren har tidligst rett på AAP fra' })).not.toBeInTheDocument();
  });
});
