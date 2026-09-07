export const FLAGS = [
  'TilbakekrevingBelopFilter',
  'ArenasakerLenkeTilVisninsklient',
  'ReturAarsakJournalforing',
  'VisValgForDialogmelding',
  'HentFastlege',
  'OppgavelisteMedBelopISaksbehandling',
  'KravSteg',
  'BeregningstidspunktAarsak',
  'VentStatusForTilbakekreving',
  'VisMigrereSakFraArenaKnapp',
  'Avslag11_27',
  'SkalViseAlleSykdomssteg',
  'DialogMedBehandler',
  'kopierPerioder',
] as const;

export type FlagNames = (typeof FLAGS)[number];
export type Flags = Record<FlagNames, boolean>;

export const mockedFlags: Flags = {
  TilbakekrevingBelopFilter: true,
  ArenasakerLenkeTilVisninsklient: true,
  ReturAarsakJournalforing: true,
  VisValgForDialogmelding: true,
  HentFastlege: true,
  OppgavelisteMedBelopISaksbehandling: true,
  KravSteg: true,
  BeregningstidspunktAarsak: true,
  VentStatusForTilbakekreving: true,
  VisMigrereSakFraArenaKnapp: true,
  Avslag11_27: true,
  SkalViseAlleSykdomssteg: true,
  DialogMedBehandler: true,
  kopierPerioder: true,
};
