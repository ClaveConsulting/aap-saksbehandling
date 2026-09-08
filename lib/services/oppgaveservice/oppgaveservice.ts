import { apiFetch } from 'lib/services/apiFetch';
import { CACHE_1_TIME, genererTagMedNavIdent } from 'lib/services/cache';
import {
  AvreserverOppgaveDto,
  Enhet,
  EnhetSynkroniseringOppgave,
  Kø,
  Markering,
  MineOppgaverQueryParams,
  OppgaveInfoTilSøk,
  OppgaveVisningsinformasjon,
  OppgavelisteRequest,
  OppgavelisteResponse,
  OppgaverPåSak,
  PlukkOppgaveResponse,
  SakOgAvklaringsbehov,
  SaksbehandlerSøkRequest,
  SaksbehandlerSøkRespons,
  SaksnummerResponse,
  SøkResponse,
  TildelOppgaveRequest,
  TildelOppgaveResponse,
  TildeltStatus,
} from 'lib/types/oppgaveTypes';
import { FetchResponse } from 'lib/utils/api';
import { isLocal } from 'lib/utils/environment';
import { mineOppgaverQueryParams, queryParamsArray } from 'lib/utils/request';
import 'server-only';

const oppgaveApiBaseURL = process.env.OPPGAVE_API_BASE_URL;
const oppgaveApiScope = process.env.OPPGAVE_API_SCOPE ?? '';

export const hentKøer = async (enheter: string[]) => {
  const url = `${oppgaveApiBaseURL}/filter?${queryParamsArray('enheter', enheter)}`;
  return await apiFetch<Kø[]>(url, oppgaveApiScope, 'GET', undefined, {
    revalidate: CACHE_1_TIME,
    tags: [await genererTagMedNavIdent('køer')],
  });
};

export const hentOppgaverForFilter = async (data: OppgavelisteRequest) => {
  const url = `${oppgaveApiBaseURL}/oppgaveliste`;
  return await apiFetch<OppgavelisteResponse>(url, oppgaveApiScope, 'POST', data);
};

const lokalFakeOppgave = isLocal();
export async function hentSaksnummerGittBehandling(behandlingReferanse: string) {
  if (lokalFakeOppgave) {
    const mockResponse: FetchResponse<SaksnummerResponse> = {
      type: 'SUCCESS',
      data: {
        saksnummer: '123456',
      },
    };

    return mockResponse;
  }

  const url = `${oppgaveApiBaseURL}/${behandlingReferanse}/hent-saksnummer`;
  return await apiFetch<SaksnummerResponse>(url, oppgaveApiScope, 'GET');
}

export async function hentOppgaveVisningsinfo(behandlingReferanse: string) {
  if (lokalFakeOppgave) {
    const mockResponse: FetchResponse<OppgaveVisningsinformasjon> = {
      type: 'SUCCESS',
      data: {
        id: 123,
        markeringer: [],
        versjon: 0,
        harUlesteDokumenter: false,
        skjermingInfo: {
          erSkjermet: false,
          harFortroligAdresse: false,
          harStrengtFortroligAdresse: false,
        },
      },
    };

    return mockResponse;
  }

  const url = `${oppgaveApiBaseURL}/${behandlingReferanse}/hent-oppgave-visningsinformasjon`;
  return await apiFetch<OppgaveVisningsinformasjon>(url, oppgaveApiScope, 'GET');
}

export const hentMineOppgaver = async (queryParams: MineOppgaverQueryParams) => {
  const query = queryParams?.sortby
    ? mineOppgaverQueryParams({ sortby: queryParams?.sortby, sortorder: queryParams.sortorder })
    : '';
  const url = `${oppgaveApiBaseURL}/mine-oppgaver${query ? `?${query}` : ''}`;
  return await apiFetch<OppgavelisteResponse>(url, oppgaveApiScope, 'GET');
};

export const hentMineSisteOppgaver = async () => {
  const url = `${oppgaveApiBaseURL}/mine-siste-oppgaver`;
  return await apiFetch<SakOgAvklaringsbehov[]>(url, oppgaveApiScope, 'GET');
};

export async function hentEnheter() {
  const url = `${oppgaveApiBaseURL}/enheter`;

  return await apiFetch<Array<Enhet>>(url, oppgaveApiScope, 'GET', undefined, {
    revalidate: CACHE_1_TIME,
    tags: [await genererTagMedNavIdent('enheter')],
  });
}

export async function synkroniserEnhetPåOppgave(data: EnhetSynkroniseringOppgave) {
  const url = `${oppgaveApiBaseURL}/synkroniser-enhet-paa-oppgave`;
  return await apiFetch<void>(url, oppgaveApiScope, 'POST', { oppgaveId: data.oppgaveId });
}

export async function søkPåSaksbehandler(data: SaksbehandlerSøkRequest) {
  const url = `${oppgaveApiBaseURL}/saksbehandler-sok`;
  return await apiFetch<SaksbehandlerSøkRespons>(url, oppgaveApiScope, 'POST', {
    oppgaver: data.oppgaver,
    søketekst: data.søketekst,
    enheter: data.enheter,
  });
}

export async function tildelTilSaksbehandler(data: TildelOppgaveRequest) {
  const url = `${oppgaveApiBaseURL}/tildel-oppgaver`;
  return await apiFetch<TildelOppgaveResponse>(url, oppgaveApiScope, 'POST', data);
}

export async function hentTildeltStatus(behandlingReferanse: string) {
  const url = `${oppgaveApiBaseURL}/${behandlingReferanse}/tildelt-status`;
  return await apiFetch<TildeltStatus>(url, oppgaveApiScope, 'GET');
}

export async function avreserverOppgave({ oppgaver }: AvreserverOppgaveDto) {
  const url = `${oppgaveApiBaseURL}/avreserver-oppgaver`;
  return await apiFetch<unknown>(url, oppgaveApiScope, 'POST', { oppgaver: oppgaver });
}
export async function plukkOppgave(oppgaveId: number, versjon: number) {
  const url = `${oppgaveApiBaseURL}/plukk-oppgave`;
  return await apiFetch<PlukkOppgaveResponse>(url, oppgaveApiScope, 'POST', { oppgaveId, versjon });
}

export async function mottattDokumenterLest(behandlingRef: string) {
  const url = `${oppgaveApiBaseURL}/mottatt-dokumenter-lest`;
  return await apiFetch<{}>(url, oppgaveApiScope, 'POST', { behandlingRef: behandlingRef });
}

export async function fjernHelseopplysningIkon(behandlingRef: string) {
  const url = `${oppgaveApiBaseURL}/fjern-helseopplysning-ikon`;
  return await apiFetch<{}>(url, oppgaveApiScope, 'POST', { behandlingRef: behandlingRef });
}

export async function fjernUføreVedtakIkon(behandlingRef: string) {
  const url = `${oppgaveApiBaseURL}/fjern-uførevedtak-ikon`;
  return await apiFetch<{}>(url, oppgaveApiScope, 'POST', { behandlingRef: behandlingRef });
}

const lokalFakeOppgaveSøk = isLocal();
export async function oppgaveTekstSøk(søketekst: string) {
  if (lokalFakeOppgaveSøk) {
    const oppgaver: OppgaveInfoTilSøk[] = [
      {
        // @ts-expect-error Fiks type i backend
        behandlingstype: 'DOKUMENT_H\u00C5NDTERING',
        enhetForKø: '',
        opprettetAv: '',
        opprettetTidspunkt: '',
        status: 'OPPRETTET',
        versjon: 0,
      },
    ];

    const mockData: FetchResponse<SøkResponse> = {
      type: 'SUCCESS',
      status: 200,
      data: {
        harAdressebeskyttelse: false,
        oppgaver: oppgaver,
        harTilgang: true,
      },
    };

    return mockData;
  }
  const url = `${oppgaveApiBaseURL}/sok`;
  return await apiFetch<SøkResponse>(url, oppgaveApiScope, 'POST', { søketekst });
}

export async function hentOppgaverPåSak(saksnummer: string) {
  const url = `${oppgaveApiBaseURL}/${saksnummer}/hent-oppgaver-paa-sak`;
  return await apiFetch<OppgaverPåSak>(url, oppgaveApiScope, 'GET');
}

export const hentGjeldendeMarkeringerForBehandling = async (referanse: string) => {
  if (lokalFakeOppgave) {
    const mockData: FetchResponse<Markering[]> = {
      type: 'SUCCESS',
      status: 200,
      data: [],
    };
    return mockData;
  }

  const url = `${oppgaveApiBaseURL}/${referanse}/hent-gjeldende-markeringer-for-behandling`;
  return await apiFetch<Markering[]>(url, oppgaveApiScope, 'GET', undefined);
};

export const opprettMarkeringHendelse = async (referanse: string, body: object) => {
  if (lokalFakeOppgave) {
    const mockData: FetchResponse<Markering[]> = {
      type: 'SUCCESS',
      status: 200,
      data: [],
    };
    return mockData;
  }

  const url = `${oppgaveApiBaseURL}/${referanse}/opprett-markering-hendelse`;
  return await apiFetch(url, oppgaveApiScope, 'POST', body);
};
