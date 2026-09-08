import umami, { UmamiEventData } from '@umami/node';
import { logWarning } from 'lib/serverutlis/logger';
import { isDev, isProd } from 'lib/utils/environment';
import { UmamiKelvinEvent } from 'lib/utils/umami/kelvinEvent';
import { NextResponse } from 'next/server';

const umamiSporingskodeDev = 'ebb233f3-6c6d-4b9f-b84d-9a11a3c2f16f';
const umamiSporingskodeProd = 'b2b87dc6-5a1c-4212-ac64-818f80fd12f2';
if (isDev()) {
  umami.init({
    websiteId: umamiSporingskodeDev,
    hostUrl: process.env.UMAMI_HOST_URL,
  });
}
if (isProd()) {
  umami.init({
    websiteId: umamiSporingskodeProd,
    hostUrl: process.env.UMAMI_HOST_URL,
  });
}

export async function POST(req: Request) {
  const payload: UmamiKelvinEvent = await req.json();
  const filtrertEventData: UmamiEventData = buildEventData(payload);

  try {
    await umami.track(payload.name, filtrertEventData);
  } catch {
    logWarning(`umami-event feilet: ${payload.name}`);
  }
  return NextResponse.json('OK', { status: 200 });
}

function buildEventData(payload: UmamiKelvinEvent): UmamiEventData {
  switch (payload.type) {
    case 'VARIGHET':
      return {
        varighet_sekunder: payload.varighet_sekunder,
        ...(payload.brevtype ? { brevtype: payload.brevtype } : {}),
      };
    case 'HENDELSER_VARIGHET':
      return {
        delhendelse: payload.delhendelse,
        hendelser_serie: payload.hendelser_serie,
        hendelser_serie_id: payload.hendelser_serie_id,
        tidsstempel: payload.tidsstempel,
        varighet_sekunder: payload.varighet_sekunder,
        ...(payload.varighet_sekunder_siden_forrige !== null
          ? { varighet_sekunder_siden_forrige: payload.varighet_sekunder_siden_forrige }
          : {}),
      };
    case 'LENKE_KLIKK':
      return {
        lenketekst: payload.lenketekst,
        ...(payload.steg ? { steg: payload.steg } : {}),
      };
    case 'NAVIGERING':
      return {
        inngang: payload.inngang,
        ...(payload.reserverer ? { reserverer: 'true' } : {}),
      };
    case 'SYKDOMSVURDERING':
      return {
        antallSpoersmaalFraMal: payload.antallSpoersmaalFraMal,
      };
  }
}
