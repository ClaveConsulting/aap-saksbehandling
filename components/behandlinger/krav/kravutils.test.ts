import { describe, expect, it } from 'vitest';
import { KravGrunnlag, KravVurdering, RelevantKrav, RelevantKravLøsning, SøknadUtenKrav } from 'lib/types/types';
import {
  byggInitielleVurderinger,
  byggKravVurderingerFraSkjema,
  finnKravVurderingByReferanse,
  finnSøknadUtenKravByReferanse,
  hentOriginaleFormFelter,
  kravVurderingTilFormFields,
  KravVurderingFormFields,
  søknadUtenKravTilFormFields,
} from 'components/behandlinger/krav/kravutils';
import { JaEllerNei, MuligRettFraTilbakedateresValg, SøknadsdatoEndresValg } from 'lib/utils/form';

const bruker = 'Z000000';
const behandlingId = { id: 1 };

function relevantKrav(overrides: Partial<RelevantKrav> = {}): RelevantKrav {
  return {
    type: 'RELEVANT_KRAV',
    referanse: 'krav-1',
    journalpostId: { identifikator: 'jp-1' },
    begrunnelse: 'Opprinnelig begrunnelse',
    opprettet: '2025-04-01T10:30:00Z',
    muligRettFra: '2025-04-01',
    søknadsdato: { dato: '2025-04-01', årsak: 'SøknadMottatt', begrunnelse: '' },
    vurdertAv: bruker,
    vurdertIBehandling: behandlingId,
    ...overrides,
  };
}

function søknadUtenKrav(overrides: Partial<SøknadUtenKrav> = {}): SøknadUtenKrav {
  return {
    journalpostId: { identifikator: 'jp-ny' },
    mottattTidspunkt: '2025-05-01T12:30:00',
    ...overrides,
  };
}

function grunnlag(overrides: Partial<KravGrunnlag> = {}): KravGrunnlag {
  return {
    harTilgangTilÅSaksbehandle: true,
    nyeVurderinger: [],
    vedtatteVurderinger: [],
    søknader: [],
    søknaderUtenKravvurdering: [],
    ...overrides,
  };
}

describe('kravVurderingTilFormFields og søknadUtenKravTilFormFields', () => {
  it('mapper felter fra et RELEVANT_KRAV korrekt, inkludert formattert søknadsdato', () => {
    const felter = kravVurderingTilFormFields(relevantKrav());

    expect(felter).toEqual<KravVurderingFormFields>({
      skalVurderesForNyEllerGjenopptattAAPRettighet: JaEllerNei.Ja,
      journalpostId: 'jp-1',
      begrunnelse: 'Opprinnelig begrunnelse',
      søknadsdatoDato: '01.04.2025',
      søknadsdatoÅrsak: 'SøknadMottatt',
      søknadsdatoEndres: 'Nei',
      søknadsdatoBegrunnelse: '',
      overstyrDato: '',
      overstyrÅrsak: '',
      muligRettFraTilbakedateres: 'Nei',
      muligRettFraBegrunnelse: '',
    });
  });

  it('mapper overstyrMuligRettFra når det finnes på kravet', () => {
    const krav = relevantKrav({
      overstyrMuligRettFra: {
        dato: '2025-06-15',
        årsak: 'MisvisendeOpplysninger',
        begrunnelse: 'Feil informasjon fra Nav',
      },
    });

    const felter = kravVurderingTilFormFields(krav);

    expect(felter.overstyrDato).toEqual('15.06.2025');
    expect(felter.overstyrÅrsak).toEqual('MisvisendeOpplysninger');
    expect(felter.muligRettFraTilbakedateres).toEqual(MuligRettFraTilbakedateresValg.MisvisendeOpplysninger);
    expect(felter.muligRettFraBegrunnelse).toEqual('Feil informasjon fra Nav');
  });

  it.each([['BrukerHarSøktTidligere'], ['FeilregistrertSøknadsdato']] as const)(
    'utleder søknadsdatoEndres=%s fra søknadsdato.årsak, og mapper søknadsdatoBegrunnelse',
    (årsak) => {
      const krav = relevantKrav({
        søknadsdato: { dato: '2025-04-10', årsak, begrunnelse: 'Bruker har dokumentert tidligere kontakt' },
      });

      const felter = kravVurderingTilFormFields(krav);

      expect(felter.søknadsdatoEndres).toEqual(årsak);
      expect(felter.søknadsdatoBegrunnelse).toEqual('Bruker har dokumentert tidligere kontakt');
    }
  );

  it('utleder muligRettFraTilbakedateres=IkkeIStandTilÅSøkeTidligere fra overstyrMuligRettFra.årsak', () => {
    const krav = relevantKrav({
      overstyrMuligRettFra: {
        dato: '2025-02-01',
        årsak: 'IkkeIStandTilÅSøkeTidligere',
        begrunnelse: 'Bruker var innlagt på sykehus',
      },
    });

    const felter = kravVurderingTilFormFields(krav);

    expect(felter.muligRettFraTilbakedateres).toEqual(MuligRettFraTilbakedateresValg.IkkeIStandTilÅSøkeTidligere);
    expect(felter.muligRettFraBegrunnelse).toEqual('Bruker var innlagt på sykehus');
  });

  it('utleder søknadsdatoEndres=Nei og muligRettFraTilbakedateres=Nei når overstyrMuligRettFra mangler', () => {
    const felter = kravVurderingTilFormFields(relevantKrav());

    expect(felter.søknadsdatoEndres).toEqual(SøknadsdatoEndresValg.Nei);
    expect(felter.muligRettFraTilbakedateres).toEqual(MuligRettFraTilbakedateresValg.Nei);
  });

  it('returnerer tomme søknadsdato-/overstyr-felter for kravtyper uten søknadsdato (f.eks. KLAGE)', () => {
    const klage: KravVurdering = {
      type: 'KLAGE',
      referanse: 'krav-2',
      journalpostId: { identifikator: 'jp-2' },
      begrunnelse: 'Klagebegrunnelse',
      opprettet: '2025-04-01T10:30:00Z',
      vurdertAv: bruker,
      vurdertIBehandling: behandlingId,
    };

    const felter = kravVurderingTilFormFields(klage);

    expect(felter.søknadsdatoDato).toEqual('');
    expect(felter.søknadsdatoÅrsak).toEqual('');
    expect(felter.overstyrDato).toEqual('');
    expect(felter.overstyrÅrsak).toEqual('');
  });

  it('bygger et RELEVANT_KRAV-utkast fra en søknad uten kravvurdering, forhåndsutfylt med mottattTidspunkt', () => {
    const søknad = søknadUtenKrav({ mottattTidspunkt: '2025-05-10T09:00:00' });

    const felter = søknadUtenKravTilFormFields(søknad);

    expect(felter).toEqual<KravVurderingFormFields>({
      skalVurderesForNyEllerGjenopptattAAPRettighet: '',
      journalpostId: 'jp-ny',
      begrunnelse: '',
      søknadsdatoDato: '10.05.2025',
      søknadsdatoÅrsak: 'SøknadMottatt',
      søknadsdatoEndres: 'Nei',
      søknadsdatoBegrunnelse: '',
      overstyrDato: '',
      overstyrÅrsak: '',
      muligRettFraTilbakedateres: 'Nei',
      muligRettFraBegrunnelse: '',
    });
  });
});

describe('byggInitielleVurderinger', () => {
  it('slår sammen nyeVurderinger, vedtatteVurderinger og søknaderUtenKravvurdering på referanse/journalpostId', () => {
    const nyttKrav = relevantKrav({ referanse: 'krav-ny' });
    const vedtattKrav = relevantKrav({ referanse: 'krav-vedtatt', begrunnelse: 'Vedtatt begrunnelse' });
    const søknad = søknadUtenKrav({ journalpostId: { identifikator: 'jp-utkast' } });

    const vurderinger = byggInitielleVurderinger(
      grunnlag({ nyeVurderinger: [nyttKrav], vedtatteVurderinger: [vedtattKrav], søknaderUtenKravvurdering: [søknad] })
    );

    expect(Object.keys(vurderinger).sort()).toEqual(['jp-utkast', 'krav-ny', 'krav-vedtatt'].sort());
    expect(vurderinger['krav-vedtatt'].begrunnelse).toEqual('Vedtatt begrunnelse');
    expect(vurderinger['jp-utkast'].begrunnelse).toEqual('');
  });

  it('returnerer et tomt objekt når grunnlag er undefined', () => {
    expect(byggInitielleVurderinger(undefined)).toEqual({});
  });
});

describe('finnKravVurderingByReferanse, finnSøknadUtenKravByReferanse og hentOriginaleFormFelter', () => {
  const nyttKrav = relevantKrav({ referanse: 'krav-ny' });
  const vedtattKrav = relevantKrav({ referanse: 'krav-vedtatt' });
  const søknad = søknadUtenKrav({ journalpostId: { identifikator: 'jp-utkast' } });
  const grunnlagMedAlt = grunnlag({
    nyeVurderinger: [nyttKrav],
    vedtatteVurderinger: [vedtattKrav],
    søknaderUtenKravvurdering: [søknad],
  });

  it('finnKravVurderingByReferanse finner krav i både nye og vedtatte vurderinger', () => {
    expect(finnKravVurderingByReferanse(grunnlagMedAlt, 'krav-ny')).toEqual(nyttKrav);
    expect(finnKravVurderingByReferanse(grunnlagMedAlt, 'krav-vedtatt')).toEqual(vedtattKrav);
    expect(finnKravVurderingByReferanse(grunnlagMedAlt, 'finnes-ikke')).toBeUndefined();
  });

  it('finnSøknadUtenKravByReferanse finner søknad basert på journalpostId', () => {
    expect(finnSøknadUtenKravByReferanse(grunnlagMedAlt, 'jp-utkast')).toEqual(søknad);
    expect(finnSøknadUtenKravByReferanse(grunnlagMedAlt, 'finnes-ikke')).toBeUndefined();
  });

  it('hentOriginaleFormFelter prioriterer eksisterende krav, faller tilbake til søknad, og returnerer undefined for ukjent referanse', () => {
    expect(hentOriginaleFormFelter(grunnlagMedAlt, 'krav-ny')).toEqual(kravVurderingTilFormFields(nyttKrav));
    expect(hentOriginaleFormFelter(grunnlagMedAlt, 'jp-utkast')).toEqual(søknadUtenKravTilFormFields(søknad));
    expect(hentOriginaleFormFelter(grunnlagMedAlt, 'finnes-ikke')).toBeUndefined();
  });
});

describe('byggKravVurderingerFraSkjema', () => {
  it('ekskluderer et eksisterende krav (nyeVurderinger) som ikke er endret av saksbehandler', () => {
    const krav = relevantKrav({ referanse: 'krav-uendret' });
    const uendretGrunnlag = grunnlag({ nyeVurderinger: [krav] });
    const vurderinger = { [krav.referanse]: kravVurderingTilFormFields(krav) };

    const løsninger = byggKravVurderingerFraSkjema(uendretGrunnlag, vurderinger);

    expect(løsninger).toEqual([]);
  });

  it('inkluderer et nyeVurderinger-krav som er endret, og setter referanse (regresjonstest for tapt referanse-bug)', () => {
    const krav = relevantKrav({ referanse: 'krav-ny-endret' });
    const grunnlagMedNyttKrav = grunnlag({ nyeVurderinger: [krav] });
    const endretFelter: KravVurderingFormFields = {
      ...kravVurderingTilFormFields(krav),
      begrunnelse: 'Oppdatert begrunnelse',
    };

    const løsninger = byggKravVurderingerFraSkjema(grunnlagMedNyttKrav, { [krav.referanse]: endretFelter });

    expect(løsninger).toHaveLength(1);
    expect(løsninger[0].referanse).toEqual('krav-ny-endret');
    expect(løsninger[0].begrunnelse).toEqual('Oppdatert begrunnelse');
  });

  it('inkluderer et vedtatteVurderinger-krav som er endret, og setter referanse', () => {
    const krav = relevantKrav({ referanse: 'krav-vedtatt-endret' });
    const grunnlagMedVedtattKrav = grunnlag({ vedtatteVurderinger: [krav] });
    const endretFelter: KravVurderingFormFields = {
      ...kravVurderingTilFormFields(krav),
      overstyrDato: '01.07.2025',
      overstyrÅrsak: 'MisvisendeOpplysninger',
    };

    const løsninger = byggKravVurderingerFraSkjema(grunnlagMedVedtattKrav, { [krav.referanse]: endretFelter });

    expect(løsninger).toHaveLength(1);
    expect(løsninger[0].referanse).toEqual('krav-vedtatt-endret');
  });

  it('inkluderer et utfylt utkast fra en søknad uten kravvurdering, uten referanse', () => {
    const søknad = søknadUtenKrav({ journalpostId: { identifikator: 'jp-utkast' } });
    const grunnlagMedSøknad = grunnlag({ søknaderUtenKravvurdering: [søknad] });
    const utfyltUtkast: KravVurderingFormFields = {
      ...søknadUtenKravTilFormFields(søknad),
      begrunnelse: 'Nytt krav opprettet av saksbehandler',
    };

    const løsninger = byggKravVurderingerFraSkjema(grunnlagMedSøknad, { 'jp-utkast': utfyltUtkast });

    expect(løsninger).toHaveLength(1);
    expect(løsninger[0].referanse).toBeUndefined();
    expect(løsninger[0].begrunnelse).toEqual('Nytt krav opprettet av saksbehandler');
  });

  it('ekskluderer et urørt utkast fra en søknad uten kravvurdering (fortsatt lik default)', () => {
    const søknad = søknadUtenKrav({ journalpostId: { identifikator: 'jp-urørt' } });
    const grunnlagMedSøknad = grunnlag({ søknaderUtenKravvurdering: [søknad] });

    const løsninger = byggKravVurderingerFraSkjema(grunnlagMedSøknad, {
      'jp-urørt': søknadUtenKravTilFormFields(søknad),
    });

    expect(løsninger).toEqual([]);
  });

  it('ekskluderer en referanse som verken finnes som krav eller søknad i grunnlaget', () => {
    const løsninger = byggKravVurderingerFraSkjema(grunnlag(), {
      'ukjent-referanse': søknadUtenKravTilFormFields(søknadUtenKrav()),
    });

    expect(løsninger).toEqual([]);
  });

  it('kaster feil dersom et RELEVANT_KRAV mangler gyldig søknadsdato ved bygging av løsning', () => {
    const søknad = søknadUtenKrav({ journalpostId: { identifikator: 'jp-uten-dato' } });
    const grunnlagMedSøknad = grunnlag({ søknaderUtenKravvurdering: [søknad] });
    const ugyldigUtkast: KravVurderingFormFields = {
      ...søknadUtenKravTilFormFields(søknad),
      begrunnelse: 'Har begrunnelse, men søknadsdato er tømt',
      søknadsdatoDato: '',
      skalVurderesForNyEllerGjenopptattAAPRettighet: 'ja',
    };

    expect(() => byggKravVurderingerFraSkjema(grunnlagMedSøknad, { 'jp-uten-dato': ugyldigUtkast })).toThrow();
  });
});

describe('byggKravVurderingerFraSkjema - §22-13 femte og syvende ledd', () => {
  function relevantKravLøsning(felter: KravVurderingFormFields): RelevantKravLøsning {
    const krav = relevantKrav({ referanse: 'krav-1' });
    const løsninger = byggKravVurderingerFraSkjema(grunnlag({ nyeVurderinger: [krav] }), {
      'krav-1': felter,
    });
    expect(løsninger).toHaveLength(1);
    return løsninger[0] as RelevantKravLøsning;
  }

  it.each([['BrukerHarSøktTidligere'], ['FeilregistrertSøknadsdato']] as const)(
    'setter søknadsdato.årsak=%s og videresender søknadsdatoBegrunnelse når søknadsdatoEndres=%s',
    (valg) => {
      const felter: KravVurderingFormFields = {
        ...kravVurderingTilFormFields(relevantKrav({ referanse: 'krav-1' })),
        søknadsdatoDato: '10.02.2025',
        søknadsdatoEndres: valg,
        søknadsdatoBegrunnelse: 'Bruker dokumenterte tidligere kontakt med Nav',
      };

      const løsning = relevantKravLøsning(felter);

      expect(løsning.søknadsdato).toEqual({
        dato: '2025-02-10',
        årsak: valg,
        begrunnelse: 'Bruker dokumenterte tidligere kontakt med Nav',
      });
    }
  );

  it('setter søknadsdato.årsak=SøknadMottatt når søknadsdatoEndres=Nei, men videresender begrunnelsen likevel', () => {
    const felter: KravVurderingFormFields = {
      ...kravVurderingTilFormFields(relevantKrav({ referanse: 'krav-1' })),
      søknadsdatoEndres: SøknadsdatoEndresValg.Nei,
      søknadsdatoBegrunnelse: 'Vurdert, men ingen grunn til å endre søknadsdato',
    };

    const løsning = relevantKravLøsning(felter);

    expect(løsning.søknadsdato).toEqual({
      dato: '2025-04-01',
      årsak: 'SøknadMottatt',
      begrunnelse: 'Vurdert, men ingen grunn til å endre søknadsdato',
    });
  });

  it.each([['IkkeIStandTilÅSøkeTidligere'], ['MisvisendeOpplysninger']] as const)(
    'bygger overstyrMuligRettFra med årsak=%s og begrunnelse når muligRettFraTilbakedateres=%s og dato er fylt ut',
    (valg) => {
      const felter: KravVurderingFormFields = {
        ...kravVurderingTilFormFields(relevantKrav({ referanse: 'krav-1' })),
        overstyrDato: '01.03.2025',
        muligRettFraTilbakedateres: valg,
        muligRettFraBegrunnelse: 'Dokumentert i journalnotat',
      };

      const løsning = relevantKravLøsning(felter);

      expect(løsning.overstyrMuligRettFra).toEqual({
        dato: '2025-03-01',
        årsak: valg,
        begrunnelse: 'Dokumentert i journalnotat',
      });
    }
  );

  it('utelater overstyrMuligRettFra når muligRettFraTilbakedateres=Nei, selv om overstyrDato er fylt ut', () => {
    const felter: KravVurderingFormFields = {
      ...kravVurderingTilFormFields(relevantKrav({ referanse: 'krav-1' })),
      overstyrDato: '01.03.2025',
      muligRettFraTilbakedateres: MuligRettFraTilbakedateresValg.Nei,
      muligRettFraBegrunnelse: 'Ikke aktuelt',
    };

    const løsning = relevantKravLøsning(felter);

    expect(løsning.overstyrMuligRettFra).toBeUndefined();
  });

  it('utelater overstyrMuligRettFra når muligRettFraTilbakedateres er Ja, men overstyrDato mangler', () => {
    const felter: KravVurderingFormFields = {
      ...kravVurderingTilFormFields(relevantKrav({ referanse: 'krav-1' })),
      overstyrDato: '',
      muligRettFraTilbakedateres: MuligRettFraTilbakedateresValg.MisvisendeOpplysninger,
      muligRettFraBegrunnelse: 'Mangler dato',
    };

    const løsning = relevantKravLøsning(felter);

    expect(løsning.overstyrMuligRettFra).toBeUndefined();
  });
});
