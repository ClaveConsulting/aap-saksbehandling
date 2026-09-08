import { ForeslåVedtakGrunnlag, UnderveisAvslagsÅrsak } from 'lib/types/types';
import { TableStyled } from 'components/tablestyled/TableStyled';
import { HStack, Table } from '@navikt/ds-react';
import { formaterDatoForFrontend } from 'lib/utils/date';
import { CheckmarkCircleIcon, XMarkOctagonIcon } from '@navikt/aksel-icons';
import styles from './ForeslåVedtakTabell.module.css';
import { exhaustiveCheck } from 'lib/utils/typescript';
import { mapRettighetsTypeTilTekst } from 'lib/utils/rettighetstype';

interface Props {
  grunnlag: ForeslåVedtakGrunnlag;
}

export const ForeslåVedtakTabell = ({ grunnlag }: Props) => {
  const sistePeriodeMedRettighetIndex = grunnlag.perioder.findLastIndex((periode) => periode.utfall === 'OPPFYLT');

  return (
    <TableStyled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Rettighet</Table.HeaderCell>
          <Table.HeaderCell>Periode</Table.HeaderCell>
          <Table.HeaderCell>Type</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {grunnlag.perioder.length === 0 ? (
          <Table.Row>
            <Table.DataCell>
              <HStack gap={'space-8'} align={'center'}>
                <XMarkOctagonIcon className={styles.avslåttIcon} />
                {mapUtfallTilTekst('IKKE_OPPFYLT')}
              </HStack>
            </Table.DataCell>
            <Table.DataCell>-</Table.DataCell>
            <Table.DataCell>-</Table.DataCell>
          </Table.Row>
        ) : (
          grunnlag.perioder.map((vedtaksPeriode, index) => {
            const avslagUtenViderePerioder =
              vedtaksPeriode.utfall === 'IKKE_OPPFYLT' && index > sistePeriodeMedRettighetIndex;

            return (
              <Table.Row
                key={`${vedtaksPeriode.utfall}-${vedtaksPeriode.rettighetsType}-${vedtaksPeriode.periode?.fom}`}
              >
                <Table.DataCell>
                  <HStack gap={'space-8'} align={'center'}>
                    {vedtaksPeriode.utfall == 'OPPFYLT' ? (
                      <CheckmarkCircleIcon className={styles.godkjentIcon} />
                    ) : (
                      <XMarkOctagonIcon className={styles.avslåttIcon} />
                    )}
                    {mapUtfallTilTekst(vedtaksPeriode.utfall)}
                  </HStack>
                </Table.DataCell>
                <Table.DataCell>
                  {formaterDatoForFrontend(vedtaksPeriode.periode.fom)} -
                  {!avslagUtenViderePerioder && formaterDatoForFrontend(vedtaksPeriode.periode.tom)}
                </Table.DataCell>
                <Table.DataCell>
                  {vedtaksPeriode.utfall == 'OPPFYLT'
                    ? mapRettighetsTypeTilTekst(vedtaksPeriode.rettighetsType)
                    : mapAvslagsÅrsakTilTekst(
                        vedtaksPeriode.avslagsårsak.vilkårsavslag,
                        vedtaksPeriode.avslagsårsak.underveisavslag
                      )}
                </Table.DataCell>
              </Table.Row>
            );
          })
        )}
      </Table.Body>
    </TableStyled>
  );
};

function mapUtfallTilTekst(utfall: string) {
  switch (utfall) {
    case 'OPPFYLT':
      return 'AAP innvilget';
    case 'IKKE_OPPFYLT':
      return 'Ikke rett på AAP';
  }
}

function mapUnderveisÅrsakTilHjemmel(underveisAvslag: UnderveisAvslagsÅrsak) {
  switch (underveisAvslag) {
    case 'IKKE_GRUNNLEGGENDE_RETT':
      return '';
    case 'IKKE_OVERHOLDT_MELDEPLIKT_SANKSJON':
      return '§ 11-10';
    case 'BRUDD_PÅ_AKTIVITETSPLIKT_11_7_OPPHØR':
      return '§ 11-7';
    case 'SONER_STRAFF':
      return '§ 11-26';
    case 'ARBEIDER_MER_ENN_GRENSEVERDI':
      return '§ 11-23';
    case 'BRUDD_PÅ_AKTIVITETSPLIKT_11_7_STANS':
      return '§ 11-7';
    case 'BRUDD_PÅ_OPPHOLDSKRAV_11_3_STANS':
      return '§ 11-3';
    case 'BRUDD_PÅ_OPPHOLDSKRAV_11_3_OPPHØR':
      return '§ 11-3';
    case 'MELDEPLIKT_FRIST_IKKE_PASSERT':
      return '§ 11-10';
    case 'VARIGHETSKVOTE_BRUKT_OPP':
      return '§ 11-12';
    default:
      return exhaustiveCheck(underveisAvslag);
  }
}

function mapAvslagsÅrsakTilTekst(vilkårAvslag: string[], underveisAvslag?: UnderveisAvslagsÅrsak | null) {
  if (underveisAvslag && underveisAvslag != 'IKKE_GRUNNLEGGENDE_RETT') {
    vilkårAvslag.push(mapUnderveisÅrsakTilHjemmel(underveisAvslag));
  }
  return [...new Set(vilkårAvslag)].join(', ');
}
