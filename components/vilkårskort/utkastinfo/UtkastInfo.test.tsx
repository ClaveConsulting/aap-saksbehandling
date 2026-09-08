import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UtkastInfo } from 'components/vilkårskort/utkastinfo/UtkastInfo';
import { MellomlagretVurdering } from 'lib/types/types';
import { defaultFlytResponse, setMockFlytResponse } from 'vitestSetup';

const mellomlagretVurdering: MellomlagretVurdering = {
  vurdertDato: '2025-08-21T12:00:00.000',
  vurdertAv: 'Jan T. Loven',
  data: '{}',
  avklaringsbehovkode: '5003',
  behandlingId: { id: 1 },
};

describe('UtkastInfo', () => {
  it('viser utkast-dato og saksbehandler når ikke readOnly og mellomlagring finnes', () => {
    render(<UtkastInfo mellomlagretVurdering={mellomlagretVurdering} readOnly={false} />);

    expect(screen.getByText('Utkast lagret 21.08.2025 12:00 (Jan T. Loven)')).toBeVisible();
  });

  it('viser "Slett utkast"-knapp når ikke readOnly og onDeleteMellomlagringClick er satt', () => {
    render(
      <UtkastInfo mellomlagretVurdering={mellomlagretVurdering} readOnly={false} onDeleteMellomlagringClick={vi.fn()} />
    );

    expect(screen.getByRole('button', { name: 'Slett utkast' })).toBeVisible();
  });

  it('viser ikke "Slett utkast"-knapp når onDeleteMellomlagringClick ikke er satt', () => {
    render(<UtkastInfo mellomlagretVurdering={mellomlagretVurdering} readOnly={false} />);

    expect(screen.queryByRole('button', { name: 'Slett utkast' })).not.toBeInTheDocument();
  });

  it('viser ingenting når mellomlagretVurdering er undefined', () => {
    render(<UtkastInfo mellomlagretVurdering={undefined} readOnly={false} onDeleteMellomlagringClick={vi.fn()} />);

    expect(screen.queryByText(/Utkast lagret/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Slett utkast' })).not.toBeInTheDocument();
  });

  it('viser ikke utkast-info når readOnly og visVentekort er false', () => {
    render(
      <UtkastInfo mellomlagretVurdering={mellomlagretVurdering} readOnly={true} onDeleteMellomlagringClick={vi.fn()} />
    );

    expect(screen.queryByText(/Utkast lagret/)).not.toBeInTheDocument();
  });

  it('viser utkast-info, men ikke "Slett utkast"-knapp når readOnly og visVentekort er true', () => {
    setMockFlytResponse({ ...defaultFlytResponse, visning: { ...defaultFlytResponse.visning, visVentekort: true } });

    render(
      <UtkastInfo mellomlagretVurdering={mellomlagretVurdering} readOnly={true} onDeleteMellomlagringClick={vi.fn()} />
    );

    expect(screen.getByText('Utkast lagret 21.08.2025 12:00 (Jan T. Loven)')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Slett utkast' })).not.toBeInTheDocument();
  });
});
