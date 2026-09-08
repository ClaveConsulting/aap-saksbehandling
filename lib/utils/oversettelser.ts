import { OppgaveAvklaringsbehovKode, OppgaveBehandlingstype, UføreVedtakStatus } from 'lib/types/oppgaveTypes';
import { PostmottakSettPåVentÅrsaker, PostmottakTypeBehandling } from 'lib/types/postmottakTypes';
import {
  SettPåVentÅrsaker,
  TilbakekrevingVenteÅrsaker,
  TypeBehandling,
  VilkårUtfall,
  ÅrsakTilOpprettelse,
} from 'lib/types/types';
import { exhaustiveCheck } from 'lib/utils/typescript';

const behovskodeMap = {
  // Behandlingsflyt
  '4101': '§ 11-7 Aktivitetsplikt',
  '4102': 'Venter på uttalelse fra brukeren på forhåndsvarsel aktivitetsplikt § 11-7',
  '4201': '§ 11-9 Aktivitetsplikt',
  '4301': 'Avbryt behandling',
  '5001': '§ 11-14 Student',
  '5002': '§ 11-10 andre ledd. Perioder uten overholdt meldeplikt',
  '5003': '§ 11-5 Nedsatt arbeidsevne',
  '5004': '§ 11-23 Arbeidsevne som ikke er utnyttet',
  '5005': '§ 11-10 Fritak fra meldeplikt',
  '5006': '§ 11-6 Behov for bistand',
  '5007': '§ 11-13 Sykepengeerstatning',
  '5008': '§ 11-19 Beregningstidspunkt',
  '5009': '§ 11-20 Barnetillegg',
  '5010': '§ 11-26 Soning',
  '5011': '§ 11-25 Helseinstitusjon',
  '5012': 'Avklar samordning gradering',
  '5013': '§ 11-22 Yrkesskade',
  '5014': 'Fastsett yrkesskadebeløp',
  '5015': '§ 11-17 AAP som arbeidssøker',
  '5016': 'Forhåndsvarsel aktivitetsplikt',
  '5017': 'Lovvalg og medlemskap',
  '5018': 'Venter på uttalelse fra brukeren på forhåndsvarsel',
  '5019': 'Venter på utenlandsoverføring',
  '5020': '§ 11-2 Forutgående medlemskap',
  '5021': 'Overstyr lovvalg og medlemskap',
  '5022': 'Overstyr § 11-2 Forutgående medlemskap',
  '5023': 'Venter på klageimplementasjon',
  '5024': 'Avklar samordning uføre',
  '5025': 'Samordning vent på virkningstidspunkt',
  '5026': 'Refusjon',
  '5027': 'Samordning annen statlig ytelse',
  '5028': 'Vurder trekk av søknad',
  '5029': 'Vurder § 22-13 syvende ledd',
  '5030': 'Samordning arbeidsgiver',
  '5031': '§ 11-18 AAP under behandling av krav om uføretrygd',
  '5032': '§ 11-17 Arbeidsavklaringspenger i perioden som arbeidssøker',
  '5033': 'Avbryt revurdering',
  '5034': 'Avklar samordning sykestipend',
  '5035': 'Avklar oppholdskrav',
  '5036': 'Samordning barnepensjon',
  '5037': '§ 11-14 Student',
  '5038': 'Vurder krav',
  '5039': 'Avklar stønadsperiode',
  '5040': '§ 11-4 andre ledd. Krav om inntektsbortfall etter fylte 62 år',
  '5041': 'Skriv vedtaksbrev (saksbehandler)',
  '5042': 'Avslag § 11-27',
  '5050': 'Skriv brev',
  '5051': 'Skriv vedtaksbrev',
  '5052': 'Skriv forhåndsvarsel brudd aktivitetsplikt',
  '5053': 'Skriv sykdomsvurdering brev',
  '5054': 'Bekreft vurderinger',
  '5056': 'Samordning refusjonskrav',
  '5057': 'Arbeidsopptrapping',
  '5058': '§ 11-15 Etablering av egen virksomhet',
  '5059': 'Avklar vedtaksperiode',
  '5060': 'Oppsummert rettighet i vedtaket',
  '5096': 'Forslå uttak',
  '5097': 'Kvalitetssikre sak',
  '5098': 'Foreslå vedtak',
  '5099': 'Beslutte sak',
  '5999': 'Fastsett påklaget behandling',
  '6000': 'Formkrav',
  '6001': 'Fastsett behanadlende enhet',
  '6002': 'Vurder klage',
  '6003': 'Behandle klage',
  '6004': 'Effektuer avvist på formkrav',
  '6005': 'Skriv forhåndsvarsel klage',
  '6006': 'Oppsummering klagebehandlingen',
  '6007': 'Venter på uttalelse fra brukeren på klage forhåndsvarsel',
  '6008': 'Håndter svar fra Kabal',
  '6009': 'Fastsett fullmektig/verge',
  '6010': 'Vurder trekk av klage',
  '7001': 'Fastsett manuell inntekt',
  '8001': 'Oppfølgingsoppgave - kontor',
  '8002': 'Oppfølgingsoppgave - NAY',
  '8003': 'Venter på oppfølging',
  '8004': 'Venter på oppfølging',
  '9001': 'Manuelt satt på vent',
  '9002': 'Bestill brev',
  '9003': 'Bestill legeerklæring',
  '9004': 'Opprett hendelse på sak',
  '9082': 'Vurder tilbakekreving',
  '9083': 'Vurder tilbakekreving beslutter',

  // Postmottak
  '1337': 'Kategoriser dokument',
  '1338': 'Digitaliser dokument',
  '1339': 'Avklar tema',
  '1340': 'Avklar saksnummer',
  '1341': 'Endre tema',
  '1342': 'Vent på Gosys',
  '1343': 'Avklar fordeling',
} as const;

export function mapBehovskodeTilBehovstype(kode: OppgaveAvklaringsbehovKode | string): string {
  return behovskodeMap[kode as OppgaveAvklaringsbehovKode] ?? 'Ukjent behovstype';
}

export function mapTilVenteÅrsakTekst(
  årsak: SettPåVentÅrsaker | PostmottakSettPåVentÅrsaker | TilbakekrevingVenteÅrsaker
): string {
  switch (årsak) {
    case 'VENTER_PÅ_OPPLYSNINGER':
      return 'Venter på opplysninger';
    case 'VENTER_PÅ_OPPLYSNINGER_FRA_UTENLANDSKE_MYNDIGHETER':
      return 'Venter på opplysninger fra utenlandske myndigheter';
    case 'VENTER_PÅ_MEDISINSKE_OPPLYSNINGER':
      return 'Venter på medisinske opplysninger';
    case 'VENTER_PÅ_VURDERING_AV_ROL':
      return 'Venter på vurdering fra rådgivende overlege';
    case 'VENTER_PÅ_SVAR_FRA_BRUKER':
      return 'Venter på svar fra brukeren';
    case 'VENTER_PÅ_MASKINELL_AVKLARING':
      return 'Venter på maskinell avklaring';
    case 'VENTER_PÅ_UTENLANDSK_VIDEREFORING_AVKLARING':
      return 'Venter på videreføring av sak til utenlandsk trygdemyndighet';
    case 'VENTER_PÅ_KLAGE_IMPLEMENTASJON':
      return 'Venter på klageimplementasjon';
    case 'VENTER_PÅ_SVAR_PÅ_FORHÅNDSVARSEL':
      return 'Venter på svar på forhåndsvarsel';
    case 'VENTER_PÅ_FUNKSJONALITET_AVSLAG_11_27':
      return 'Venter på manglende funksjonalitet for å avslå på § 11-27';
    case 'VENTER_PÅ_FUNKSJONALITET':
      return 'Venter på manglende funksjonalitet';
    case 'VENTER_PÅ_BEHANDLING_I_GOSYS':
      return 'Venter på behandling i Gosys';
    case 'AVVENTER_BRUKERUTTALELSE':
      return 'Venter på brukeruttalelse';
  }
  exhaustiveCheck(årsak);
}

export function mapTilResultat(resultat: UføreVedtakStatus): string {
  switch (resultat) {
    case 'INNVILGELSE':
      return 'innvilgelse';
    case 'OPPHØR':
      return 'opphør';
    case 'AVSLAG':
      return 'avslag';
    case 'ENDRET':
      return 'endret';
  }
  exhaustiveCheck(resultat);
}

export function mapTilSteggruppeTekst(steggruppe: string) {
  switch (steggruppe) {
    case 'KRAV':
      return 'Krav';
    case 'SØKNAD':
      return 'Trekk søknad';
    case 'AVBRYT_REVURDERING':
      return 'Avbryt revurdering';
    case 'ALDER':
      return 'Alder';
    case 'AVSLAG_11_27':
      return 'Avslag § 11-27';
    case 'LOVVALG':
      return 'Lovvalg og medlemskap';
    case 'START_BEHANDLING':
      return 'Start behandling';
    case 'MEDLEMSKAP':
      return 'Forutgående medlemskap';
    case 'BARNETILLEGG':
      return 'Barnetillegg';
    case 'STUDENT':
      return 'Student';
    case 'SYKDOM':
      return 'Sykdom';
    case 'GRUNNLAG':
      return 'Grunnlag';
    case 'ET_ANNET_STED':
      return 'Institusjonsopphold';
    case 'UNDERVEIS':
      return 'Underveis';
    case 'TILKJENT_YTELSE':
      return 'Tilkjent ytelse';
    case 'SIMULERING':
      return 'Simulering';
    case 'VEDTAK':
      return 'Vedtak';
    case 'FATTE_VEDTAK':
      return 'Fatte vedtak';
    case 'KVALITETSSIKRING':
      return 'Kvalitetssikring';
    case 'IVERKSETT_VEDTAK':
      return 'Iverksett vedtak';
    case 'BREV':
      return 'Brev';
    case 'AVKLAR_TEMA':
      return 'Avklar tema';
    case 'AVKLAR_SAK':
      return 'Avklar sak';
    case 'DIGITALISER':
      return 'Digitaliser';
    case 'OVERLEVER_TIL_FAGSYSTEM':
      return 'Send til fagsystem';
    case 'RETTIGHETSPERIODE':
      return '§ 22-13 syvende ledd';
    case 'SAMORDNING':
      return 'Forhold til andre ytelser';
    case 'FORMKRAV':
      return 'Formkrav';
    case 'TREKK_KLAGE':
      return 'Trekk klage';
    case 'KLAGEBEHANDLING_KONTOR':
      return 'Vurder klage';
    case 'KLAGEBEHANDLING_NAY':
      return 'Behandle klage';
    case 'OMGJØRING':
      return 'Omgjøring';
    case 'OPPRETTHOLDELSE':
      return 'Opprettholdelse';
    case 'SVAR_FRA_ANDREINSTANS':
      return 'Håndter svar fra Nav Klageinstans';
    case 'IVERKSETT_KONSEKVENS':
      return 'Iverksett konsekvens';
    case 'AVKLAR_OPPPFØLGING':
      return 'Avklar oppfølging';
    case 'AKTIVITETSPLIKT_11_7':
      return '§ 11-7 Aktivitetsplikt';
    case 'AKTIVITETSPLIKT_11_9':
      return '§ 11-9 Aktivitetsplikt';
    case 'UDEFINERT':
      return 'Udefinert';
    case 'OPPHOLDSKRAV':
      return 'Oppholdskrav';
    case 'VEDTAKSLENGDE':
      return 'Vedtaksperiode';
    case 'AVBRYT_AKTIVITETSPLIKTBEHANDLING':
      return 'Avbryt behandling';
    default:
      return `${steggruppe}`;
  }
}

export function mapTilOppgaveBehandlingstypeTekst(behandlingsType: OppgaveBehandlingstype) {
  switch (behandlingsType) {
    case 'FØRSTEGANGSBEHANDLING':
      return 'Førstegangsbehandling';
    case 'JOURNALFØRING':
      return 'Journalføring';
    case 'KLAGE':
      return 'Klage';
    case 'DOKUMENT_HÅNDTERING':
      return 'Dokumenthåndtering';
    case 'REVURDERING':
      return 'Revurdering';
    case 'TILBAKEKREVING':
      return 'Tilbakekreving';
    case 'SVAR_FRA_ANDREINSTANS':
      return 'Svar fra andreinstans';
    case 'OPPFØLGINGSBEHANDLING':
      return 'Oppfølgingsoppgave';
    case 'AKTIVITETSPLIKT':
      return 'Aktivitetsplikt § 11-7';
    case 'AKTIVITETSPLIKT_11_9':
      return 'Aktivitetsplikt § 11-9';
    case 'FORDELING':
      return 'Fordeling';
  }
  exhaustiveCheck(behandlingsType);
}

export function mapTilÅrsakTilOpprettelseTilTekst(årsakTilOpprettelse: ÅrsakTilOpprettelse) {
  switch (årsakTilOpprettelse) {
    case 'SØKNAD':
      return 'Søknad';
    case 'MANUELL_OPPRETTELSE':
      return 'Manuelt opprettet';
    case 'HELSEOPPLYSNINGER':
      return 'Helseopplysninger';
    case 'ANNET_RELEVANT_DOKUMENT':
      return 'Annet relevant dokument';
    case 'OMGJØRING_ETTER_KLAGE':
      return 'Omgjøring etter klage';
    case 'OMGJØRING_ETTER_SVAR_FRA_KLAGEINSTANS':
      return 'Omgjøring etter svar fra klageinstans';
    case 'FASTSATT_PERIODE_PASSERT':
      return 'Fastsatt periode passert';
    case 'FRITAK_MELDEPLIKT':
      return 'Fritak meldeplikt';
    case 'MELDEKORT':
      return 'Meldekort';
    case 'AKTIVITETSMELDING':
      return 'Aktivitetsmelding';
    case 'OPPFØLGINGSOPPGAVE':
      return 'Oppfølgingsoppgave';
    case 'SVAR_FRA_KLAGEINSTANS':
      return 'Svar fra klageinstans';
    case 'KLAGE':
      return 'Klage';
    case 'ENDRING_I_REGISTERDATA':
      return 'Endring i register';
    case 'AKTIVITETSPLIKT':
      return 'Aktivitetsplikt';
    case 'UTVID_VEDTAKSLENGDE':
      return 'Utvid vedtaksperiode';
  }
}

export function mapGrunnTilString(grunn: string): string {
  switch (grunn) {
    case 'FEIL_LOVANVENDELSE':
      return 'Feil lovanvendelse';
    case 'MANGELFULL_BEGRUNNELSE':
      return 'Mangelfull begrunnelse';
    case 'MANGLENDE_UTREDNING':
      return 'Manglende utredning';
    case 'SKRIVEFEIL':
      return 'Skrivefeil';
    default:
      return grunn;
  }
}

export function mapInnstillingTilTekst(grunn: 'OPPRETTHOLD' | 'OMGJØR' | 'DELVIS_OMGJØR'): string {
  switch (grunn) {
    case 'OPPRETTHOLD':
      return 'Vedtak opprettholdes';
    case 'OMGJØR':
      return 'Vedtak omgjøres';
    case 'DELVIS_OMGJØR':
      return 'Delvis omgjøring';
  }
}

export function mapUtfallTilTekst(utfall: VilkårUtfall): string {
  switch (utfall) {
    case 'OPPFYLT':
      return 'Oppfylt';
    case 'IKKE_OPPFYLT':
      return 'Ikke oppfylt';
    case 'IKKE_RELEVANT':
      return 'Ikke relevant';
    case 'IKKE_VURDERT':
      return 'Ikke vurdert';
  }
}

export function mapTypeBehandlingTilTekst(typeBehandling: TypeBehandling | PostmottakTypeBehandling) {
  switch (typeBehandling) {
    case 'Førstegangsbehandling':
      return 'Førstegangsbehandling';
    case 'Klage':
      return 'Klage';
    case 'Revurdering':
      return 'Revurdering';
    case 'Tilbakekreving':
      return 'Tilbakekreving';
    case 'SvarFraAndreinstans':
      return 'Svar fra Nav Klageinstans';
    case 'OppfølgingsBehandling':
      return 'Oppfølgingsoppgave';
    case 'Aktivitetsplikt':
      return 'Aktivitetsplikt § 11-7';
    case 'Aktivitetsplikt11_9':
      return 'Aktivitetsplikt § 11-9';
    case 'DokumentHåndtering':
      return 'Dokumenthåndtering';
    default:
      return typeBehandling;
  }
}

export function mapStatusTilTekst(
  status:
    | 'VENT'
    | 'RETUR_FRA_KVALITETSSIKRER'
    | 'RETUR_FRA_BESLUTTER'
    | 'ER_HASTESAK'
    | 'VENTEFRIST_UTLØPT'
    | 'RETUR_FRA_VEILEDER'
    | 'RETUR_FRA_SAKSBEHANDLER'
    | 'AVSLAG_11_5'
): string {
  switch (status) {
    case 'VENT':
      return 'På vent';
    case 'RETUR_FRA_KVALITETSSIKRER':
      return 'Retur fra kvalitetssikrer';
    case 'RETUR_FRA_BESLUTTER':
      return 'Retur fra beslutter';
    case 'ER_HASTESAK':
      return 'Hastesak';
    case 'VENTEFRIST_UTLØPT':
      return 'Ventefrist utløpt';
    case 'RETUR_FRA_VEILEDER':
      return 'Retur fra veileder';
    case 'RETUR_FRA_SAKSBEHANDLER':
      return 'Retur fra saksbehandler';
    case 'AVSLAG_11_5':
      return 'Avslag § 11-5';
  }
}

export function mapReturFraStatusTilTekst(status: string): string {
  switch (status) {
    case 'SENDT_TILBAKE_FRA_BESLUTTER':
      return 'Sendt tilbake fra beslutter';
    case 'SENDT_TILBAKE_FRA_KVALITETSSIKRER':
      return 'Sendt tilbake fra kvalitetssikrer';
    default:
      return status;
  }
}
