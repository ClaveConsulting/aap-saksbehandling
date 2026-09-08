'use client';

import { useParamsMedType } from 'hooks/saksbehandling/BehandlingHook';
import { useMellomlagring } from 'hooks/saksbehandling/MellomlagringHook';
import { useVilkårskortVisning } from 'hooks/saksbehandling/visning/VisningHook';
import { MellomlagretVurdering, TrukketSøknadGrunnlag, TrukketSøknadVurdering, VurderingerMeta } from 'lib/types/types';
import { Behovstype, getJaNeiEllerUndefined, JaEllerNei, JaEllerNeiOptions } from 'lib/utils/form';
import { loggUmamiVarighet, useUmamiStartTidspunkt } from 'lib/utils/umami/varighet';
import { SubmitEventHandler } from 'react';

import { FormField } from 'components/form/FormField';
import { useConfigForm } from 'components/form/FormHook';
import { VilkårskortMedFormOgMellomlagring } from 'components/vilkårskort/vilkårskortmedformogmellomlagring/VilkårskortMedFormOgMellomlagring';
import { useLøsAvklaringsbehov } from 'hooks/saksbehandling/løsavklaringsbehov/useLøsAvklaringsbehov';

import { Alert } from 'components/alert/Alert';
interface Props {
  grunnlag: TrukketSøknadGrunnlag;
  readOnly: boolean;
  behandlingVersjon: number;
  initialMellomlagretVurdering?: MellomlagretVurdering;
}

type TrukketSøknadÅrsak = TrukketSøknadVurdering['aarsak'];

interface FormFields {
  begrunnelse: string;
  skalTrekkes?: string;
  aarsak?: TrukketSøknadÅrsak;
}

type DraftFormFields = Partial<FormFields>;

export const TrekkSøknad = ({ grunnlag, readOnly, behandlingVersjon, initialMellomlagretVurdering }: Props) => {
  const { behandlingsreferanse } = useParamsMedType();
  const { løsAvklaringsbehov, løsAvklaringsbehovIsLoading, løsAvklaringsbehovStatus, løsAvklaringsbehovError } =
    useLøsAvklaringsbehov('SØKNAD');

  const { visningActions, formReadOnly, visningModus } = useVilkårskortVisning(
    readOnly,
    'SØKNAD',
    initialMellomlagretVurdering
  );
  const umamiStartTidspunkt = useUmamiStartTidspunkt(visningModus);

  const sisteVurdering = grunnlag?.vurderinger.at(-1);

  const defaultValues: DraftFormFields = initialMellomlagretVurdering
    ? JSON.parse(initialMellomlagretVurdering.data)
    : mapVurderingToDraftFormFields(sisteVurdering);

  const { form, formFields } = useConfigForm<FormFields>(
    {
      begrunnelse: {
        type: 'textarea',
        label: 'Begrunnelse',
        defaultValue: defaultValues.begrunnelse,
        rules: { required: 'Du må begrunne hvorfor søknaden skal trekkes' },
      },
      skalTrekkes: {
        type: 'radio',
        label: 'Skal søknaden trekkes?',
        options: JaEllerNeiOptions,
        rules: { required: 'Du må velge om søknaden skal trekkes' },
        defaultValue: defaultValues.skalTrekkes,
      },
      aarsak: {
        type: 'radio',
        label: 'Hvorfor trekkes søknaden?',
        options: [
          { label: 'Brukeren søkte for tidlig', value: 'BRUKER_SOKTE_FOR_TIDLIG' },
          { label: 'Brukeren søkte på feil ytelse', value: 'BRUKER_SOKTE_FEIL_YTELSE' },
          { label: 'Brukeren ønsker ikke å søke om AAP lenger', value: 'BRUKER_ONSKER_IKKE_SOKE_LENGER' },
          { label: 'Annet', value: 'ANNET' },
        ],
        rules: { required: 'Du må velge en årsak for å trekke søknaden' },
        defaultValue: defaultValues.aarsak || undefined,
      },
    },
    { readOnly: formReadOnly }
  );

  const harValgtAtSoknadTrekkes = form.watch('skalTrekkes') === JaEllerNei.Ja;

  const { slettMellomlagring, mellomlagretVurdering, nullstillMellomlagretVurdering } = useMellomlagring(
    Behovstype.VURDER_TREKK_AV_SØKNAD_KODE,
    initialMellomlagretVurdering,
    form
  );

  const handleSubmit: SubmitEventHandler = (event) => {
    form.handleSubmit(
      (data) => {
        løsAvklaringsbehov({
          behandlingVersjon: behandlingVersjon,
          behov: {
            behovstype: Behovstype.VURDER_TREKK_AV_SØKNAD_KODE,
            begrunnelse: data.begrunnelse,
            skalTrekkes: data.skalTrekkes === JaEllerNei.Ja,
            aarsak: data.aarsak || undefined,
          },
          referanse: behandlingsreferanse,
        });
      },
      () => {
        loggUmamiVarighet('STEG_TREKK_SØKNAD_VARIGHET', umamiStartTidspunkt, Date.now());
        nullstillMellomlagretVurdering();
      }
    )(event);
  };

  return (
    <VilkårskortMedFormOgMellomlagring
      heading={'Trekk søknad'}
      steg={'SØKNAD'}
      onSubmit={handleSubmit}
      status={løsAvklaringsbehovStatus}
      isLoading={løsAvklaringsbehovIsLoading}
      løsBehovOgGåTilNesteStegError={løsAvklaringsbehovError}
      vilkårTilhørerNavKontor={false}
      mellomlagretVurdering={mellomlagretVurdering}
      onDeleteMellomlagringClick={() => {
        slettMellomlagring(() =>
          form.reset(sisteVurdering ? mapVurderingToDraftFormFields(sisteVurdering) : emptyDraftFormFields())
        );
      }}
      vurderingerMeta={sisteVurderingFormMeta(sisteVurdering)}
      visningModus={visningModus}
      formReset={() => form.reset(mellomlagretVurdering ? JSON.parse(mellomlagretVurdering.data) : undefined)}
      visningActions={visningActions}
    >
      <FormField form={form} formField={formFields.begrunnelse} className="begrunnelse" />
      <FormField form={form} formField={formFields.skalTrekkes} horizontalRadio />
      {harValgtAtSoknadTrekkes && (
        <>
          <FormField form={form} formField={formFields.aarsak} />
          <Alert variant={'info'}>
            Husk at trekk av søknad skal være brukers eget ønske, og at dialogen med bruker må journalføres. Informer
            bruker om at saken avsluttes, og at ny søknad må sendes dersom bruker ombestemmer seg. Alle vurderinger som
            er gjort på saken vil bli slettet når søknaden trekkes.
          </Alert>
        </>
      )}
    </VilkårskortMedFormOgMellomlagring>
  );
};

function sisteVurderingFormMeta(sisteVurdering: TrukketSøknadVurdering | undefined): VurderingerMeta | undefined {
  if (!sisteVurdering) return undefined;

  if (sisteVurdering.skalTrekkes) {
    return { trukketAv: sisteVurdering.vurderingerMeta.vurdertAv };
  } else {
    return { vurdertAv: sisteVurdering.vurderingerMeta.vurdertAv };
  }
}

function mapVurderingToDraftFormFields(vurdering?: TrukketSøknadVurdering): DraftFormFields {
  return {
    begrunnelse: vurdering?.begrunnelse,
    skalTrekkes: getJaNeiEllerUndefined(vurdering?.skalTrekkes),
    aarsak: vurdering?.aarsak ?? undefined,
  };
}

function emptyDraftFormFields(): DraftFormFields {
  return {
    begrunnelse: '',
    skalTrekkes: '',
  };
}
