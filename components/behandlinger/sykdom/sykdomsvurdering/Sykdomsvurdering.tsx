'use client';

import { LightBulbIcon } from '@navikt/aksel-icons';
import { InfoCard, VStack } from '@navikt/ds-react';
import { parseISO } from 'date-fns';
import { useAccordionsSignal } from 'hooks/AccordionSignalHook';
import { useSak } from 'hooks/SakHook';
import { useParamsMedType } from 'hooks/saksbehandling/BehandlingHook';
import { useMellomlagring } from 'hooks/saksbehandling/MellomlagringHook';
import { useVilkårskortVisning } from 'hooks/saksbehandling/visning/VisningHook';
import { clientHentRelevanteDokumenter } from 'lib/dokumentClientApi';
import { Dato } from 'lib/types/Dato';
import {
  ArbeidsevneNedsattValg,
  MellomlagretVurdering,
  StudentGrunnlag,
  SykdomsGrunnlag,
  TypeBehandling,
  VurderingFormMeta,
} from 'lib/types/types';
import { isSuccess } from 'lib/utils/api';
import { formaterDatoForBackend, parseDatoFraDatePicker } from 'lib/utils/date';
import { Behovstype, getJaNeiEllerUndefined, getStringEllerUndefined, JaEllerNei } from 'lib/utils/form';
import { loggUmamiVarighet, useUmamiStartTidspunkt } from 'lib/utils/umami/varighet';
import { finnesFeilForVurdering, hentFeilmeldingerForForm } from 'lib/utils/formerrors';
import { hentPerioderSomTrengerVurdering, trengerVurderingsForslag } from 'lib/utils/periodisering';
import { validerPeriodiserteVurderingerRekkefølge } from 'lib/utils/validering';
import { gyldigDatoEllerNull } from 'lib/validation/dateValidation';
import { SubmitEventHandler } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import useSWR from 'swr';

import { Alert } from 'components/alert/Alert';
import { parseDatoFraDatePickerOgTrekkFra1Dag } from 'components/behandlinger/oppholdskrav/oppholdskrav-utils';
import styles from 'components/behandlinger/sykdom/sykdomsvurdering/Sykdomsvurdering.module.css';
import { SykdomsvurderingFormInput } from 'components/behandlinger/sykdom/sykdomsvurdering/SykdomsvurderingFormInput';
import { parseOgMigrerMellomlagretData } from 'components/behandlinger/sykdom/sykdomsvurdering/SykdomsvurderingMellomlagringParser';
import { TidligereSykdomsvurdering } from 'components/behandlinger/sykdom/sykdomsvurdering/TidligereSykdomsvurdering';
import {
  DiagnoserDefaultOptions,
  hentSisteLagredeVurdering,
} from 'components/behandlinger/sykdom/sykdomsvurdering/diagnoseUtil';
import {
  defaultBegrunnelseSpørsmål,
  emptySykdomsvurderingMedDefaultBegrunnelse,
  utledVurderingStatusForTidligereVurdering,
  utledVurderingStatus,
} from 'components/behandlinger/sykdom/sykdomsvurdering/sykdomsvurdering-utils';
import mapTilPeriodisertVurdering from 'components/behandlinger/sykdom/sykdomsvurdering/vurderingMapper';
import { ValuePair } from 'components/form/FormField';
import {
  NyVurderingExpandableCard,
  skalVæreInitiellEkspandert,
} from 'components/periodisering/nyvurderingexpandablecard/NyVurderingExpandableCard';
import { TidligereVurderingExpandableCard } from 'components/periodisering/tidligerevurderingexpandablecard/TidligereVurderingExpandableCard';
import { EksterneLenkerIVilkårskort } from 'components/vilkårskort/eksternelenkerivilkårskort/EksterneLenkerIVilkårskort';
import { VilkårskortPeriodisert } from 'components/vilkårskort/vilkårskortperiodisert/VilkårskortPeriodisert';
import { useLøsAvklaringsbehov } from 'hooks/saksbehandling/løsavklaringsbehov/useLøsAvklaringsbehov';
import { loggUmamiSykdomsvurderingAntallSpørsmålFraMal } from 'lib/utils/umami/sykdomsvurdering';

export interface SykdomsvurderingerForm {
  vurderinger: Array<Sykdomsvurdering>;
}

const SYKMELDING_39UKER_BREVKODE = 'NAV 08-07.04 R';

export interface Sykdomsvurdering extends VurderingFormMeta {
  fraDato: string;
  begrunnelse: string;
  vurderingenGjelderFra?: string;
  harSkadeSykdomEllerLyte: string;
  kodeverk?: string;
  hoveddiagnose?: ValuePair | null;
  bidiagnose?: ValuePair[] | null;
  erSkadeSykdomEllerLyteVesentligdel?: JaEllerNei;
  erNedsettelseIArbeidsevneMerEnnHalvparten?: JaEllerNei;
  harNedsattArbeidsevne?: ArbeidsevneNedsattValg;
  erNedsettelseIArbeidsevneMerEnnYrkesskadeGrense?: JaEllerNei;
  yrkesskadeBegrunnelse?: string;
}

interface SykdomProps {
  behandlingVersjon: number;
  grunnlag: SykdomsGrunnlag;
  readOnly: boolean;
  typeBehandling: TypeBehandling;
  diagnoseDefaultOptions: DiagnoserDefaultOptions;
  initialMellomlagretVurdering?: MellomlagretVurdering;
  erOvergangArbeid: boolean;
  erRevurderingStudent: boolean;
  studentgrunnlag: StudentGrunnlag;
  skalViseAlleSykdomSteg?: boolean;
}

export const Sykdomsvurdering = ({
  grunnlag,
  behandlingVersjon,
  readOnly,
  diagnoseDefaultOptions,
  typeBehandling,
  initialMellomlagretVurdering,
  erOvergangArbeid,
  erRevurderingStudent,
  studentgrunnlag,
  skalViseAlleSykdomSteg = false,
}: SykdomProps) => {
  const { behandlingsreferanse } = useParamsMedType();
  const { sak } = useSak();

  const { data: relevanteDokumenter } = useSWR(
    `/api/dokumenter/bruker/helsedokumenter`,
    () => clientHentRelevanteDokumenter(sak.saksnummer, sak.ident),
    { revalidateOnFocus: false, revalidateIfStale: false }
  );

  const har39UkersSykmelding =
    isSuccess(relevanteDokumenter) &&
    relevanteDokumenter.data.filter((dokument) => dokument.brevkode?.toUpperCase() == SYKMELDING_39UKER_BREVKODE)
      .length > 0;

  const { accordionsSignal, closeAllAccordions } = useAccordionsSignal();

  const {
    løsPeriodisertAvklaringsbehov,
    løsAvklaringsbehovIsLoading,
    løsAvklaringsbehovStatus,
    løsAvklaringsbehovError,
  } = useLøsAvklaringsbehov('AVKLAR_SYKDOM');

  const { visningModus, visningActions, formReadOnly, erAktivUtenAvbryt } = useVilkårskortVisning(
    readOnly,
    'AVKLAR_SYKDOM',
    initialMellomlagretVurdering
  );
  const umamiStartTidspunkt = useUmamiStartTidspunkt(visningModus);

  const defaultValues: SykdomsvurderingerForm = initialMellomlagretVurdering
    ? parseOgMigrerMellomlagretData(initialMellomlagretVurdering.data)
    : mapGrunnlagTilDefaultvalues(grunnlag);

  const form = useForm<SykdomsvurderingerForm>({ defaultValues });
  const {
    fields: nyeVurderingerFields,
    remove,
    append,
  } = useFieldArray({ name: 'vurderinger', control: form.control });

  const { slettMellomlagring, nullstillMellomlagretVurdering, mellomlagretVurdering } = useMellomlagring(
    Behovstype.AVKLAR_SYKDOM_KODE,
    initialMellomlagretVurdering,
    form
  );

  const førsteDatoSomKanVurderes =
    grunnlag.kanVurderes[0]?.fom != null ? parseISO(grunnlag.kanVurderes[0].fom) : new Date();

  const handleSubmit: SubmitEventHandler = (event) => {
    form.handleSubmit((data) => {
      const erPerioderGyldige = validerPeriodiserteVurderingerRekkefølge({
        form,
        nyeVurderinger: data.vurderinger,
        grunnlag,
        vurderingerKanIkkeVæreFørKanVurderes: true,
      });
      if (!erPerioderGyldige) {
        return;
      }
      data.vurderinger.forEach((vurdering) => {
        loggUmamiSykdomsvurderingAntallSpørsmålFraMal(vurdering.begrunnelse, defaultBegrunnelseSpørsmål);
      });

      løsPeriodisertAvklaringsbehov(
        {
          behandlingVersjon: behandlingVersjon,
          behov: {
            behovstype: Behovstype.AVKLAR_SYKDOM_KODE,
            løsningerForPerioder: data.vurderinger.map((vurdering, index) => {
              const isLast = index === data.vurderinger.length - 1;
              const tilDato = isLast
                ? undefined
                : parseDatoFraDatePickerOgTrekkFra1Dag(data.vurderinger[index + 1].fraDato);
              return mapTilPeriodisertVurdering(
                vurdering,
                grunnlag.skalVurdereYrkesskade,
                grunnlag.erÅrsakssammenhengYrkesskade,
                førsteDatoSomKanVurderes,
                tilDato ? formaterDatoForBackend(tilDato) : undefined,
                skalViseAlleSykdomSteg
              );
            }),
          },
          referanse: behandlingsreferanse,
        },
        () => {
          loggUmamiVarighet('STEG_AVKLAR_SYKDOM_VARIGHET', umamiStartTidspunkt, Date.now());
          closeAllAccordions();
          visningActions.onBekreftClick();
          nullstillMellomlagretVurdering();
        }
      );
    })(event);
  };

  const errorList = hentFeilmeldingerForForm(form.formState.errors);
  const vedtatteVurderinger = grunnlag?.sisteVedtatteVurderinger ?? [];

  const foersteNyePeriode = nyeVurderingerFields.length > 0 ? form.watch('vurderinger.0.fraDato') : null;

  return (
    <VilkårskortPeriodisert
      heading={'§ 11-5 Nedsatt arbeidsevne og krav til årsakssammenheng'}
      steg="AVKLAR_SYKDOM"
      vilkårTilhørerNavKontor={true}
      onSubmit={handleSubmit}
      status={løsAvklaringsbehovStatus}
      isLoading={løsAvklaringsbehovIsLoading}
      løsBehovOgGåTilNesteStegError={løsAvklaringsbehovError}
      knappTekst={'Bekreft'}
      mellomlagretVurdering={mellomlagretVurdering}
      onDeleteMellomlagringClick={() => slettMellomlagring(() => form.reset(mapGrunnlagTilDefaultvalues(grunnlag)))}
      visningActions={visningActions}
      visningModus={visningModus}
      formReset={() => form.reset(mapGrunnlagTilDefaultvalues(grunnlag))}
      onLeggTilVurdering={() => append(emptySykdomsvurderingMedDefaultBegrunnelse(utledDiagnoserForNyVurdering()))}
      errorList={errorList}
    >
      <VStack gap={'space-16'}>
        <EksterneLenkerIVilkårskort steg={'AVKLAR_SYKDOM'} />

        {har39UkersSykmelding && (
          <InfoCard data-color="meta-purple" size={'small'} className={styles.sykmeldingInfo}>
            <InfoCard.Message icon={<LightBulbIcon aria-hidden />}>
              {
                'Det er nylig mottatt en 39-ukers sykemelding på saken. Du finner den under "Be om opplysninger" i høyre kolonne.'
              }
            </InfoCard.Message>
          </InfoCard>
        )}

        {erOvergangArbeid && (
          <Alert variant={'info'}>
            Hvis brukeren skal ha AAP i perioden som arbeidssøker etter § 11-17, må du først vurdere at arbeidsevnen
            ikke lenger er nedsatt etter § 11-5 og at brukeren er satt i stand til å skaffe seg arbeid som han eller hun
            kan utføre.
          </Alert>
        )}

        {erRevurderingStudent && (
          <Alert variant={'info'} size={'small'}>
            Hvis brukeren skal ha AAP som student etter § 11-14, må du først vurdere at arbeidsevnen ikke er nedsatt,
            men at bruker isteden skal vurderes for student i vurderingen av § 11-5.
          </Alert>
        )}

        {vedtatteVurderinger.map((vurdering) => (
          <TidligereVurderingExpandableCard
            key={crypto.randomUUID()}
            fom={new Dato(vurdering.fom).dato}
            tom={vurdering.tom ? parseISO(vurdering.tom) : undefined}
            førsteNyePeriodeFraDato={foersteNyePeriode != null ? parseDatoFraDatePicker(foersteNyePeriode) : null}
            vurderingStatus={utledVurderingStatusForTidligereVurdering(vurdering)}
            defaultCollapsed={nyeVurderingerFields.length > 0}
            vurderingerMeta={vurdering.vurderingerMeta}
          >
            <TidligereSykdomsvurdering vurdering={vurdering} />
          </TidligereVurderingExpandableCard>
        ))}

        {nyeVurderingerFields.map((vurdering, index) => (
          <NyVurderingExpandableCard
            key={vurdering.id}
            accordionsSignal={accordionsSignal}
            fraDato={gyldigDatoEllerNull(form.watch(`vurderinger.${index}.fraDato`))}
            vurderingStatus={utledVurderingStatus(form.watch(`vurderinger.${index}`), grunnlag.skalVurdereYrkesskade)}
            nestePeriodeFraDato={gyldigDatoEllerNull(form.watch(`vurderinger.${index + 1}.fraDato`))}
            isLast={index === nyeVurderingerFields.length - 1}
            vurdering={vurdering}
            readonly={formReadOnly}
            finnesFeil={finnesFeilForVurdering(index, errorList)}
            onSlettVurdering={() => remove(index)}
            harTidligereVurderinger={vedtatteVurderinger.length > 0}
            index={index}
            initiellEkspandert={skalVæreInitiellEkspandert(vurdering.erNyVurdering, erAktivUtenAvbryt)}
          >
            <SykdomsvurderingFormInput
              index={index}
              form={form}
              readonly={formReadOnly}
              sak={sak}
              erÅrsakssammenhengYrkesskade={grunnlag.erÅrsakssammenhengYrkesskade}
              skalVurdereYrkesskade={grunnlag.skalVurdereYrkesskade}
              rettighetsperiodeStartdato={førsteDatoSomKanVurderes}
              diagnoseDefaultOptions={diagnoseDefaultOptions}
              studentgrunnlag={studentgrunnlag}
              skalViseAlleSykdomsSteg={skalViseAlleSykdomSteg}
            />
          </NyVurderingExpandableCard>
        ))}
      </VStack>
    </VilkårskortPeriodisert>
  );

  function mapGrunnlagTilDefaultvalues(grunnlag: SykdomsGrunnlag): SykdomsvurderingerForm {
    const diagnoserForNyVurdering = utledDiagnoserForNyVurdering();

    if (trengerVurderingsForslag(grunnlag)) {
      return hentPerioderSomTrengerVurdering<Sykdomsvurdering>(grunnlag, () =>
        emptySykdomsvurderingMedDefaultBegrunnelse(diagnoserForNyVurdering)
      );
    }

    // Vi har allerede data lagret, vis enten de som er lagret i grunnlaget her eller tom liste
    return {
      vurderinger: grunnlag.nyeVurderinger.map((vurdering) => {
        const kodeverk = vurdering?.kodeverk as keyof DiagnoserDefaultOptions;

        const hoveddiagnose = kodeverk
          ? diagnoseDefaultOptions?.[kodeverk]?.hoveddiagnoserOptions.find(
              (value) => value.value === vurdering?.hoveddiagnose
            )
          : undefined;

        const bidiagnose = kodeverk
          ? diagnoseDefaultOptions?.[kodeverk].bidiagnoserOptions?.filter((option) =>
              vurdering?.bidiagnoser?.includes(option.value)
            )
          : undefined;

        return {
          fraDato: new Dato(vurdering.fom).formaterForFrontend(),
          begrunnelse: vurdering?.begrunnelse,
          harSkadeSykdomEllerLyte: getJaNeiEllerUndefined(vurdering?.harSkadeSykdomEllerLyte)!,
          harNedsattArbeidsevne: vurdering?.harNedsattArbeidsevne,
          erNedsettelseIArbeidsevneMerEnnHalvparten: getJaNeiEllerUndefined(
            vurdering?.erNedsettelseIArbeidsevneMerEnnHalvparten
          ),
          erSkadeSykdomEllerLyteVesentligdel: getJaNeiEllerUndefined(vurdering?.erSkadeSykdomEllerLyteVesentligdel),
          kodeverk: getStringEllerUndefined(vurdering.kodeverk),
          hoveddiagnose: hoveddiagnose,
          bidiagnose: bidiagnose,
          erNedsettelseIArbeidsevneMerEnnYrkesskadeGrense: getJaNeiEllerUndefined(
            vurdering?.erNedsettelseIArbeidsevneMerEnnYrkesskadeGrense
          ),
          yrkesskadeBegrunnelse: getStringEllerUndefined(vurdering?.yrkesskadeBegrunnelse),
          vurderingerMeta: vurdering.vurderingerMeta,
          erNyVurdering: false,
          behøverVurdering: false,
        };
      }),
    };
  }

  function utledDiagnoserForNyVurdering() {
    const sisteLagredeVurdering = hentSisteLagredeVurdering(typeBehandling, grunnlag);
    const kodeverk = sisteLagredeVurdering?.kodeverk as keyof DiagnoserDefaultOptions;

    if (kodeverk) {
      const hoveddiagnose = diagnoseDefaultOptions[kodeverk]?.hoveddiagnoserOptions.find(
        (option) => option.value === sisteLagredeVurdering?.hoveddiagnose
      );

      const bidiagnose = diagnoseDefaultOptions?.[kodeverk].bidiagnoserOptions.filter((option) =>
        sisteLagredeVurdering?.bidiagnoser?.includes(option.value)
      );

      return { kodeverk, hoveddiagnose, bidiagnose };
    }

    return undefined;
  }
};
