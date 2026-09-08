import { ScopedBackendSortState } from 'hooks/oppgave/BackendSorteringHook';
import { clientFetch } from 'lib/clientApi';

import {
  AvreserverOppgaveDto,
  Kø,
  MineOppgaverQueryParams,
  MineOppgaverSortBy,
  OppgavelisteRequest,
  OppgavelisteResponse,
  OppgaverPåSak,
  PlukkOppgaveRequest,
  PlukkOppgaveResponse,
  SakOgAvklaringsbehov,
  TildeltStatus,
} from './types/oppgaveTypes';
import { mapSortStateDirectionTilQueryParamEnum, mineOppgaverQueryParams, queryParamsArray } from './utils/request';

// oppgave
export async function hentOppgaverClient(oppgavelisteRequest: OppgavelisteRequest) {
  return clientFetch<OppgavelisteResponse>('/oppgave/api/oppgave/oppgaveliste', 'POST', oppgavelisteRequest);
}

export async function hentTildeltStatusClient(behandlingsreferanse: string) {
  return clientFetch<TildeltStatus>(`/oppgave/api/oppgave/${behandlingsreferanse}/tildelt-status`, 'GET');
}

export async function hentOppgaverPåSakClient(saksnummer: string) {
  return clientFetch<OppgaverPåSak>(`/oppgave/api/oppgave/sak/${saksnummer}/hent-oppgaver-paa-sak`, 'GET');
}

export async function hentMineOppgaverClient(sortering?: ScopedBackendSortState<MineOppgaverSortBy>) {
  const sortParams: MineOppgaverQueryParams = {
    sortby: sortering?.orderBy,
    sortorder: sortering?.direction ? mapSortStateDirectionTilQueryParamEnum(sortering.direction) : undefined,
  };
  const query = sortParams.sortby ? mineOppgaverQueryParams(sortParams) : '';
  return clientFetch<OppgavelisteResponse>(`/oppgave/api/oppgave/mine-oppgaver?${query}`, 'GET');
}

export async function avreserverOppgaveClient(oppgaver: number[]) {
  const body: AvreserverOppgaveDto = {
    oppgaver: oppgaver,
  };
  return clientFetch('/oppgave/api/oppgave/avreserver', 'POST', body);
}
export async function hentKøerForEnheterClient(enheter: string[]) {
  const url = `/oppgave/api/filter?${queryParamsArray('enheter', enheter)}`;
  return clientFetch<Kø[]>(url, 'GET');
}
export async function plukkOppgaveClient(oppgaveId: number, versjon: number) {
  const payload: PlukkOppgaveRequest = { oppgaveId, versjon };
  return await clientFetch<PlukkOppgaveResponse>('/oppgave/api/oppgave/plukk-oppgave', 'POST', payload);
}
export async function synkroniserOppgaveMedEnhetClient(oppgaveId: number) {
  return await clientFetch<void>('/oppgave/api/oppgave/synkroniser-enhet-paa-oppgave', 'POST', {
    oppgaveId: oppgaveId,
  });
}
export function clientMottattDokumenterLest(behandlingsreferanse: string) {
  return clientFetch(`/oppgave/api/oppgave/mottatt-dokumenter-lest`, 'POST', {
    behandlingRef: behandlingsreferanse,
  });
}

export function clientFjernUføreVedtakTag(behandlingsRef: string) {
  return clientFetch(`/oppgave/api/oppgave/fjern-uførevedtak-ikon`, 'POST', {
    behandlingsRef: behandlingsRef,
  });
}

export function clientFjernHelseopplysningIkon(behandlingsreferanse: string) {
  return clientFetch(`/oppgave/api/oppgave/fjern-helseopplysning-ikon`, 'POST', {
    behandlingRef: behandlingsreferanse,
  });
}

export async function clientHentMineSisteOppgaver() {
  return await clientFetch<SakOgAvklaringsbehov[]>('/oppgave/api/oppgave/mine-siste-oppgaver', 'GET');
}
