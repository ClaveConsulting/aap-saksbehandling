import { describe, expect, it } from 'vitest';
import { VurderingsbehovOgÅrsak } from 'lib/types/types';
import { filtrerÅrsakerForBehandlingType } from './ÅrsakTilBehandling';

// Bekrefter oppførsel fra her: https://app.mural.co/t/navdesign3580/m/navdesign3580/1691741508416/fd5f7a66bff6d60858a803726f0485840d12fdac?wid=0-1770286073815
describe('filtrer årsaker for type behandling', () => {
  const årsakMedBeskrivelse: VurderingsbehovOgÅrsak = {
    årsak: 'SØKNAD',
    opprettet: '2026-01-01',
    vurderingsbehov: [{ type: 'VURDER_RETTIGHETSPERIODE', oppdatertTid: '2026-01-01' }],
    beskrivelse: 'Dette er en begrunnelse',
  };

  const årsakUtenBeskrivelse: VurderingsbehovOgÅrsak = {
    årsak: 'MELDEKORT',
    opprettet: '2026-01-02',
    vurderingsbehov: [{ type: 'BARNETILLEGG', oppdatertTid: '2026-01-02' }],
    beskrivelse: undefined,
  };

  it('returnerer alle årsaker for Revurdering uavhengig av beskrivelse', () => {
    const årsaker = [årsakMedBeskrivelse, årsakUtenBeskrivelse];
    const filtrert = filtrerÅrsakerForBehandlingType(årsaker, 'Revurdering');
    expect(filtrert).toHaveLength(2);
    expect(filtrert).toEqual(årsaker);
  });

  it('returnerer tom liste for Revurdering når vurderingsbehovOgÅrsaker er tom', () => {
    const filtrert = filtrerÅrsakerForBehandlingType([], 'Revurdering');
    expect(filtrert).toHaveLength(0);
  });

  it('returnerer alle årsaker for Aktivitetsplikt uavhengig av beskrivelse', () => {
    const årsaker = [årsakMedBeskrivelse, årsakUtenBeskrivelse];
    const filtrert = filtrerÅrsakerForBehandlingType(årsaker, 'Aktivitetsplikt');
    expect(filtrert).toHaveLength(2);
    expect(filtrert).toEqual(årsaker);
  });

  it('returnerer tom liste for Førstegangsbehandling når vurderingsbehovOgÅrsaker er tom', () => {
    const filtrert = filtrerÅrsakerForBehandlingType([], 'Førstegangsbehandling');
    expect(filtrert).toHaveLength(0);
  });

  it('returnerer tom liste for Førstegangsbehandling når ingen årsaker har beskrivelse', () => {
    const årsaker = [årsakUtenBeskrivelse];
    const filtrert = filtrerÅrsakerForBehandlingType(årsaker, 'Førstegangsbehandling');
    expect(filtrert).toHaveLength(0);
  });

  it('inkluderer årsak med type HELSEOPPLYSNINGER for Førstegangsbehandling selv uten beskrivelse', () => {
    const helseopplysninger: VurderingsbehovOgÅrsak = {
      årsak: 'HELSEOPPLYSNINGER',
      opprettet: '2026-01-03',
      vurderingsbehov: [{ type: 'MOTTATT_LEGEERKLÆRING', oppdatertTid: '2026-01-01' }],
      beskrivelse: undefined,
    };
    const filtrert = filtrerÅrsakerForBehandlingType(
      [helseopplysninger, årsakUtenBeskrivelse],
      'Førstegangsbehandling'
    );
    expect(filtrert).toHaveLength(1);
    expect(filtrert[0]).toEqual(helseopplysninger);
  });

  it('filtrerer bort årsaker uten beskrivelse for Førstegangsbehandling', () => {
    const årsaker = [årsakMedBeskrivelse, årsakUtenBeskrivelse];
    const filtrert = filtrerÅrsakerForBehandlingType(årsaker, 'Førstegangsbehandling');
    expect(filtrert).toHaveLength(1);
    expect(filtrert[0]).toEqual(årsakMedBeskrivelse);
  });

  it('returnerer alle årsaker for Førstegangsbehandling når alle har beskrivelse', () => {
    const årsaker = [årsakMedBeskrivelse];
    const filtrert = filtrerÅrsakerForBehandlingType(årsaker, 'Førstegangsbehandling');
    expect(filtrert).toHaveLength(1);
    expect(filtrert[0]).toEqual(årsakMedBeskrivelse);
  });
});
