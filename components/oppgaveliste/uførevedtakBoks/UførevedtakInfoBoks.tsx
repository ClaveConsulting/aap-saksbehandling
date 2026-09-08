'use client';

import { GavelSoundBlockIcon } from '@navikt/aksel-icons';
import { BodyLong, BodyShort, Box, Button, Detail, HStack, Tag, VStack } from '@navikt/ds-react';
import { UføreVedtakStatus } from 'lib/types/oppgaveTypes';
import { formaterDatoForFrontend } from 'lib/utils/date';
import { mapTilResultat } from 'lib/utils/oversettelser';

import { TagMedPopover } from 'components/tagmedpopover/TagMedPopover';

import styles from './UførevedtakInfoBoks.module.css';
import { useFjernUføreVedtakTag } from 'hooks/FetchHook';
import { Alert } from 'components/alert/Alert';
import { Dispatch, SetStateAction } from 'react';

interface Props {
  oppdaterVisUforeTag: Dispatch<SetStateAction<boolean>>;
  virkningsdato: string;
  behandlingsReferanse: string;
  resultat?: UføreVedtakStatus;
}

export const UførevedtakInfoBoks = ({ behandlingsReferanse, virkningsdato, resultat, oppdaterVisUforeTag }: Props) => {
  const { fjernTag, isLoading, error } = useFjernUføreVedtakTag();
  return (
    <TagMedPopover
      ikon={<GavelSoundBlockIcon title={'Vedtak om uføretrygd er fattet'} />}
      dataColor={'meta-purple'}
      størrelse={'small'}
      tagContent={'Uføretrygd'}
      popoverContent={
        <Box maxWidth={'400px'} minWidth={'400px'}>
          <VStack gap={'space-0'}>
            <Tag
              data-color="brand-blue"
              icon={<GavelSoundBlockIcon />}
              variant={'moderate'}
              size={'medium'}
              className={styles.tag}
            >
              <BodyShort size={'small'} weight={'semibold'}>
                Vedtak om uføretrygd er fattet
              </BodyShort>
            </Tag>
            <Box padding={'space-8'}>
              <BodyLong size={'small'}>
                <Detail textColor="subtle">Begrunnelse</Detail>
                Det er fattet et vedtak om uføre med {resultat && mapTilResultat(resultat)}{' '}
                {formaterDatoForFrontend(virkningsdato)}
              </BodyLong>
            </Box>
          </VStack>
          <Box borderWidth={'1'} borderColor={'neutral-subtle'} />
          {error && (
            <HStack padding={'space-8'} justify={'center'}>
              <Alert variant={'error'}>Kunne ikke fjerne ikonet </Alert>
            </HStack>
          )}
          <HStack padding={'space-8'} justify={'end'}>
            <Button
              size={'small'}
              variant={'secondary'}
              onClick={() =>
                fjernTag(behandlingsReferanse).then((response) => {
                  if (response.ok) {
                    oppdaterVisUforeTag(false);
                  }
                })
              }
              loading={isLoading}
            >
              Marker som lest
            </Button>
          </HStack>
        </Box>
      }
    />
  );
};
