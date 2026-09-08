import { components, paths as oppgavePaths } from './oppgaveSchema';
import { components as postmottakComponents } from './postmottakSchema';
import { BehandlingsFlytAvklaringsbehovKode } from 'lib/types/types';

// postmottak
export type PostmottakAvklaringsbehovKode =
  postmottakComponents['schemas']['no.nav.aap.postmottak.kontrakt.avklaringsbehov.Definisjon']['kode'];

// oppgave
export type Kø = components['schemas']['no.nav.aap.oppgave.filter.FilterResponse'];
export type OppgavelisteRequest = components['schemas']['no.nav.aap.oppgave.liste.OppgavelisteRequest'];
export type OppgavelisteResponse = components['schemas']['no.nav.aap.oppgave.liste.OppgavelisteRespons'];
export type OppgaveMedKontekst = components['schemas']['no.nav.aap.oppgave.liste.OppgaveMedKontekstResponse'];
export type ReturInformasjon = components['schemas']['no.nav.aap.oppgave.ReturInformasjonDto'];
export type SkjermingInfo =
  components['schemas']['no.nav.aap.oppgave.liste.OppgaveMedKontekstResponse']['oppgavelisteTags']['skjermingInfo'];
export type OppgaverPåSak = components['schemas']['no.nav.aap.oppgave.hent.OppgaverPåSakResponse'];
export type OppgavePåBehandling = components['schemas']['no.nav.aap.oppgave.hent.OppgavePåBehandlingResponse'];
export type OppgaveVisningsinformasjon =
  components['schemas']['no.nav.aap.oppgave.hent.OppgaveVisningsinformasjonResponse'];
export type SaksnummerResponse = components['schemas']['no.nav.aap.oppgave.hent.SaksnummerResponse'];
export type Paging = OppgavelisteRequest['paging'];
export type Enhet = components['schemas']['no.nav.aap.oppgave.enhet.EnhetDto'];
export type PlukkOppgaveRequest = components['schemas']['no.nav.aap.oppgave.plukk.PlukkOppgaveRequest'];
export type PlukkOppgaveResponse = components['schemas']['no.nav.aap.oppgave.plukk.PlukkOppgaveResponse'];
export type SøkResponse = components['schemas']['no.nav.aap.oppgave.søk.SøkResponse'];
export type OppgaveInfoTilSøk = components['schemas']['no.nav.aap.oppgave.søk.OppgaveISøkResponse'];
export type BehandlingskontekstForOppgave = components['schemas']['no.nav.aap.oppgave.BehandlingskontekstResponse'];
export type AvreserverOppgaveDto = components['schemas']['no.nav.aap.oppgave.plukk.AvreserverOppgaveDto'];
export type Markering = components['schemas']['no.nav.aap.oppgave.markering.MarkeringDto'];
export type EnhetSynkroniseringOppgave = components['schemas']['no.nav.aap.oppgave.enhet.EnhetSynkroniseringRequest'];
export type SaksbehandlerSøkRespons = components['schemas']['no.nav.aap.oppgave.tildel.SaksbehandlerSøkResponse'];
export type SaksbehandlerSøkRequest = components['schemas']['no.nav.aap.oppgave.tildel.SaksbehandlerSøkRequest'];
export type SaksbehandlerFraSøk = components['schemas']['no.nav.aap.oppgave.tildel.SaksbehandlerDto'];
export type TildelOppgaveRequest = components['schemas']['no.nav.aap.oppgave.tildel.TildelOppgaveRequest'];
export type TildelOppgaveResponse = components['schemas']['no.nav.aap.oppgave.tildel.TildelOppgaveResponse'];
export type TildeltStatus = components['schemas']['no.nav.aap.oppgave.tildel.TildeltStatusDto'];
export type SakOgAvklaringsbehov = components['schemas']['no.nav.aap.oppgave.SakOgAvklaringsbehov'];
export type UføreVedtakStatus = components['schemas']['no.nav.aap.oppgave.UførevedtakRespons']['resultat'];

// Typer utledet direkte fra skjemaet (string unions)
export type Behandlingstype =
  components['schemas']['no.nav.aap.oppgave.BehandlingskontekstResponse']['behandlingstype'];
export type OppgaveBehandlingstype = Behandlingstype;
export type MarkeringType = components['schemas']['no.nav.aap.oppgave.markering.MarkeringDto']['markeringType'];
export type Køtype = components['schemas']['no.nav.aap.oppgave.filter.FilterResponse']['type'];
export type SortBy = NonNullable<components['schemas']['no.nav.aap.oppgave.liste.OppgaveSortering']['sortBy']>;
export type SortOrder = NonNullable<components['schemas']['no.nav.aap.oppgave.liste.OppgaveSortering']['sortOrder']>;
export type Status = components['schemas']['no.nav.aap.oppgave.liste.OppgaveMetadataResponse']['status'];
export type Behandlingstyper =
  components['schemas']['no.nav.aap.oppgave.liste.UtvidetOppgavelisteFilter']['behandlingstyper'];
export type ReturStatuser =
  components['schemas']['no.nav.aap.oppgave.liste.UtvidetOppgavelisteFilter']['returStatuser'];
export type ReturStatus = components['schemas']['no.nav.aap.oppgave.ReturInformasjonDto']['status'];
export type ReturÅrsaker = components['schemas']['no.nav.aap.oppgave.ReturInformasjonDto']['årsaker'][number];
export type MineOppgaverQueryParams = oppgavePaths['/mine-oppgaver']['get']['parameters']['query'];
export type MineOppgaverSortBy = NonNullable<NonNullable<MineOppgaverQueryParams>['sortby']>;
export type MineOppgaverSortOrder = NonNullable<NonNullable<MineOppgaverQueryParams>['sortorder']>;

export type OppgaveAvklaringsbehovKode = BehandlingsFlytAvklaringsbehovKode | PostmottakAvklaringsbehovKode;
