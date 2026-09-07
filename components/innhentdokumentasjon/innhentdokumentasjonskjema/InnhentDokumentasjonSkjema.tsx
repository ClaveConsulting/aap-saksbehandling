'use client';

import {
  BodyShort,
  Button,
  CopyButton,
  Detail,
  Heading,
  InfoCard,
  InlineMessage,
  Link,
  Loader,
  Radio,
  VStack,
} from '@navikt/ds-react';
import { SubmitEventHandler, useState } from 'react';

import styles from './InnhentDokumentasjonSkjema.module.css';
import { BestillLegeerklæring } from 'lib/types/types';
import { useParamsMedType } from 'hooks/saksbehandling/BehandlingHook';
import { clientBestillDialogmelding, clientHentFastlege, clientSøkPåBehandler } from 'lib/clientApi';
import { Forhåndsvisning } from 'components/innhentdokumentasjon/innhentdokumentasjonskjema/Forhåndsvisning';
import { AsyncComboSearch } from 'components/form/asynccombosearch/AsyncComboSearch';
import { useConfigForm } from 'components/form/FormHook';
import { FormField, ValuePair } from 'components/form/FormField';
import { RadioGroupWrapper } from 'components/form/radiogroupwrapper/RadioGroupWrapper';
import { isError, isSuccess } from 'lib/utils/api';
import { ExternalLinkIcon, InformationSquareIcon } from '@navikt/aksel-icons';
import { useFeatureFlag } from 'context/UnleashContext';
import { Alert } from 'components/alert/Alert';
import useSWR from 'swr';
import { ApiException } from 'components/saksbehandling/apiexception/ApiException';
import { slåSammenDefinerte } from 'lib/utils/string';

export type Behandler = {
  type?: string;
  behandlerRef: string;
  fnr?: string;
  fornavn: string;
  mellomnavn?: string;
  etternavn: string;
  orgnummer?: string;
  kontor?: string;
  adresse?: string;
  postnummer?: string;
  poststed?: string;
  telefon?: string;
  hprId?: string;
};

type FormFields = {
  behandlerValg: 'fastlege' | 'søk';
  behandler: ValuePair;
  dokumentasjonstype: 'L8' | 'L40';
  melding: string;
};

interface Props {
  onCancel: () => void;
  onSuccess: () => void;
}

export const formaterBehandlernavn = (behandler: Behandler): string => {
  if (behandler.mellomnavn) {
    return `${behandler.fornavn} ${behandler.mellomnavn} ${behandler.etternavn}`;
  }
  return `${behandler.fornavn} ${behandler.etternavn}`;
};

export const InnhentDokumentasjonSkjema = ({ onCancel, onSuccess }: Props) => {
  const [visModal, setVisModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const [defaultOptions, setDefaultOptions] = useState<ValuePair[]>([]);
  const { saksnummer, behandlingsreferanse } = useParamsMedType();

  const skalHenteFastlege = useFeatureFlag('HentFastlege');

  const { data: fastlege, isLoading: fastlegeIsLoading } = useSWR(
    skalHenteFastlege ? `api/dokumentinnhenting/behandleroppslag/fastlege/${saksnummer}` : null,
    () => clientHentFastlege(saksnummer),
    {
      revalidateOnFocus: false,
    }
  );

  const optionsForTypeDokumentasjon = [
    { label: 'Velg dokument', value: '' },
    { label: 'Tilleggsopplysninger (L8)', value: 'L8' },
    { label: 'Legeerklæring ved arbeidsuførhet (L40)', value: 'L40' },
    { label: 'Melding fra Nav', value: 'MELDING_FRA_NAV' },
  ];

  const fastlegeResponse = isSuccess(fastlege) ? fastlege.data : undefined;
  const fastlegeDto = fastlegeResponse?.fastlege;

  const { form, formFields } = useConfigForm<FormFields>({
    behandlerValg: {
      type: 'radio',
      label: 'Velg behandler',
      options: [],
    },
    behandler: {
      type: 'async_combobox',
    },
    dokumentasjonstype: {
      type: 'select',
      label: 'Velg dokumenttype',
      options: optionsForTypeDokumentasjon,
      rules: { required: 'Du må velge hvilken type dokumentasjon som skal bestilles' },
    },
    melding: {
      type: 'textarea',
      label: 'Skriv melding',
      rules: { required: 'Du må skrive en melding til behandler' },
    },
  });

  const handleSubmit: SubmitEventHandler = (event) => {
    form.handleSubmit(async (data) => {
      const isFastlegeValgt = fastlegeDto && data.behandlerValg === 'fastlege';
      const behandlerNavn = isFastlegeValgt
        ? `${fastlegeDto.navn}${fastlegeDto.kontor ? ` – ${fastlegeDto.kontor}` : ''}`
        : data.behandler.label;
      const behandlerRef = isFastlegeValgt ? fastlegeDto.behandlerRef : data.behandler.value.split('::')[0];
      const behandlerHprNr = isFastlegeValgt ? fastlegeDto.hprId : data.behandler.value.split('::')[1];

      const manglerHprNr = !behandlerHprNr || behandlerHprNr === 'null';

      if (manglerHprNr) {
        setError(': Mangler HPR-nr på behandler');
        return;
      }

      const body: BestillLegeerklæring = {
        behandlerNavn,
        behandlerRef,
        behandlerHprNr,
        dokumentasjonType: data.dokumentasjonstype,
        fritekst: data.melding,
        behandlingsReferanse: behandlingsreferanse,
      };

      setIsLoading(true);
      const result = await clientBestillDialogmelding(body).finally(() => setIsLoading(false));

      if (isError(result)) {
        setError(result.apiException.message);
      } else {
        onSuccess();
      }
    })(event);
  };

  const forhåndsvis = async () => {
    const validationResult = await form.trigger(); // force validation
    if (validationResult) {
      setVisModal(true);
    }
  };

  const behandlersøk = async (input: string) => {
    if (input.length <= 2 || input.length > 40) {
      return [];
    }
    const response = await clientSøkPåBehandler(input, saksnummer);
    if (isError(response)) {
      return [];
    }
    const res = response.data.map((behandler) => ({
      label: `${formaterBehandlernavn(behandler)} - ${behandler.kontor}`,
      value: `${behandler.behandlerRef}::${behandler.hprId}`,
    }));
    setDefaultOptions(res);
    return res;
  };

  const behandlerValg = form.watch('behandlerValg');

  return (
    <div className={'flex-column'}>
      <Heading level={'3'} size={'small'}>
        Be om opplysninger fra behandler
      </Heading>
      <Link
        href={
          'https://navno.sharepoint.com/sites/fag-og-ytelser-radgivende-legetjeneste/SitePages/Felles-rutine-for-innhenting-av-helseopplysninger.aspx?&xsdata=MDV8MDJ8fGIwNWFkNTJkZjczMTQzNjhiNTg5MDhkZTY4N2Y1MzAzfDYyMzY2NTM0MWVjMzQ5NjI4ODY5OWI1NTM1Mjc5ZDBifDB8MHw2MzkwNjMwOTMxOTYwNzY0MjV8VW5rbm93bnxWR1ZoYlhOVFpXTjFjbWwwZVZObGNuWnBZMlY4ZXlKRFFTSTZJbFJsWVcxelgwRlVVRk5sY25acFkyVmZVMUJQVEU5R0lpd2lWaUk2SWpBdU1DNHdNREF3SWl3aVVDSTZJbGRwYmpNeUlpd2lRVTRpT2lKUGRHaGxjaUlzSWxkVUlqb3hNWDA9fDF8TDJOb1lYUnpMekU1T20xbFpYUnBibWRmV2tSVmQxbDZUWGxOUkVGMFRXcFZNRmw1TURCTmFteHRURlJuZWs5WFVYUk9SMUV5V2xSa2ExbFhWVFZPZWtwcVFIUm9jbVZoWkM1Mk1pOXRaWE56WVdkbGN5OHhOemN3TnpFeU5URTNPRFF4fDg3ZDNjODMyYWZjNjRjZjk1MzQxMDhkZTY4N2Y1MzAxfDViMjBjYjYwZGEyODQ2ZDU4NjI1MDIzYzQ1YWFjNTdk&sdata=TktPbXp3NHJQU0hMOFRJS0dUTUxpaEFYZkoyRnA0RHNWcWNMcThtRXhaMD0%3D'
        }
        target={'_blank'}
      >
        <BodyShort size={'small'}>Rutiner for innhenting av helseopplysninger</BodyShort>
        <ExternalLinkIcon />
      </Link>
      {isError(fastlege) ? (
        fastlege.status === 403 ? (
          <InfoCard data-color="warning" size="small">
            <InfoCard.Message icon={<InformationSquareIcon aria-hidden />}>
              Du har ikke tilgang til å se registrert fastlege. Søk opp behandleren manuelt.
            </InfoCard.Message>
          </InfoCard>
        ) : (
          <ApiException apiResponses={[fastlege]} />
        )
      ) : null}
      {fastlegeIsLoading ? (
        <Loader size={'small'} title={'Henter fastlege...'} />
      ) : (
        <form onSubmit={handleSubmit} className={'flex-column'} autoComplete={'off'}>
          {fastlegeDto ? (
            <div>
              <RadioGroupWrapper
                name={'behandlerValg'}
                control={form.control}
                label={'Velg behandler'}
                rules={{ required: 'Du må velge en behandler' }}
                size={'small'}
                className={
                  behandlerValg === 'søk'
                    ? `${styles.behandlerValgGruppe} ${styles.behandlerValgÅpen}`
                    : styles.behandlerValgGruppe
                }
              >
                <Radio
                  value={'fastlege'}
                  className={styles.radioItem}
                  aria-label={`Registrert fastlege: ${fastlegeDto.navn}`}
                >
                  <div className={styles.fastlegeRadioInnhold}>
                    <div>
                      <BodyShort size={'small'}>{fastlegeDto.navn}</BodyShort>
                      <div className={styles.behandlerValgDetaljer}>
                        {fastlegeDto.kontor && <Detail>Kontor: {fastlegeDto.kontor}</Detail>}
                        {fastlegeDto.adresse && (
                          <Detail>
                            Adresse:{' '}
                            {slåSammenDefinerte(
                              ', ',
                              fastlegeDto.adresse,
                              slåSammenDefinerte(' ', fastlegeDto.postnummer, fastlegeDto.poststed)
                            )}
                          </Detail>
                        )}
                        {fastlegeDto.telefon && <Detail>Telefon: {fastlegeDto.telefon}</Detail>}
                      </div>
                    </div>
                    <Detail className={styles.fastlegeEtikett}>Registrert fastlege</Detail>
                  </div>
                  {!fastlegeResponse.varFastlegeRiktigPåSøknadstidspunkt &&
                    !fastlegeResponse.erFastlegeEndretSidenSøknadstidspunkt && (
                      <InlineMessage status="warning" size="small" className={styles.fastlegeRadioAdvarsel}>
                        Bruker oppgir i søknaden at informasjon om fastlegen ikke er riktig
                      </InlineMessage>
                    )}
                </Radio>
                <Radio value={'søk'} className={styles.radioItem}>
                  Annen behandler
                </Radio>
              </RadioGroupWrapper>
              {behandlerValg === 'søk' && (
                <div className={styles.annenBehandlerSøk}>
                  <AsyncComboSearch
                    label={'Søk etter behandler'}
                    form={form}
                    name={'behandler'}
                    fetcher={behandlersøk}
                    rules={{ required: 'Du må velge en behandler' }}
                    size={'small'}
                    defaultOptions={defaultOptions}
                  />
                </div>
              )}
            </div>
          ) : (
            <AsyncComboSearch
              label={'Velg behandler som skal motta meldingen'}
              form={form}
              name={'behandler'}
              fetcher={behandlersøk}
              rules={{ required: 'Du må velge en behandler' }}
              size={'small'}
              defaultOptions={defaultOptions}
            />
          )}
          {fastlegeResponse?.andreBehandlereFraSøknad?.map((behandler, index) => (
            <InfoCard key={index} data-color={'info'} size={'small'} as={'section'}>
              <InfoCard.Header icon={<InformationSquareIcon />}>
                <InfoCard.Title>Behandler oppgitt i søknaden</InfoCard.Title>
              </InfoCard.Header>
              <InfoCard.Content>
                <VStack>
                  {behandler.navn && (
                    <BodyShort size={'small'} as={'div'} className={styles.behandlerNavn}>
                      <span>{behandler.navn}</span>
                      <CopyButton copyText={behandler.navn} size="xsmall" />
                    </BodyShort>
                  )}
                  <div className={styles.behandlerValgDetaljer}>
                    {behandler.legekontor && <Detail>Kontor: {behandler.legekontor}</Detail>}
                    {behandler.adresse && (
                      <Detail>
                        Adresse:{' '}
                        {slåSammenDefinerte(
                          ', ',
                          behandler.adresse,
                          slåSammenDefinerte(' ', behandler.postnummer, behandler.poststed)
                        )}
                      </Detail>
                    )}
                    {behandler.telefon && <Detail>Telefon: {behandler.telefon}</Detail>}
                  </div>
                </VStack>
              </InfoCard.Content>
            </InfoCard>
          ))}
          <FormField form={form} formField={formFields.dokumentasjonstype} />
          <FormField form={form} formField={formFields.melding} />
          <div className={styles.rad}>
            <Button size={'small'} loading={isLoading}>
              Send dialogmelding
            </Button>
            <Button size={'small'} variant="secondary" type="button" onClick={forhåndsvis} disabled={isLoading}>
              Forhåndsvis
            </Button>
            {visModal && (
              <Forhåndsvisning
                saksnummer={saksnummer}
                fritekst={form.getValues('melding')}
                dokumentasjonsType={form.getValues('dokumentasjonstype')}
                visModal={visModal}
                onClose={() => setVisModal(false)}
              />
            )}
            <Button size={'small'} variant="tertiary" type="button" onClick={onCancel} disabled={isLoading}>
              Avbryt
            </Button>
          </div>
          {error && (
            <div className={styles.rad}>
              <Alert variant="error">{error || 'Noe gikk galt ved bestilling av dialogmelding'}</Alert>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
