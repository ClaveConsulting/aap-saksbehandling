'use client';

import { VStack } from '@navikt/ds-react';
import { parse } from 'date-fns';
import { useAccordionsSignal } from 'hooks/AccordionSignalHook';
import { useParamsMedType } from 'hooks/saksbehandling/BehandlingHook';
import { useMellomlagring } from 'hooks/saksbehandling/MellomlagringHook';
import { useVilkårskortVisning } from 'hooks/saksbehandling/visning/VisningHook';
import { Dato } from 'lib/types/Dato';
import {
  AvklarPeriodisertStudentLøsning,
  MellomlagretVurdering,
  StudentGrunnlag,
  StudentVurderingResponse,
  VurderingFormMeta,
} from 'lib/types/types';
import { erUendeligSlutt, formaterDatoForBackend, parseDatoFraDatePicker } from 'lib/utils/date';
import { Behovstype, getJaNeiEllerUndefined, JaEllerNei } from 'lib/utils/form';
import { loggUmamiVarighet, useUmamiStartTidspunkt } from 'lib/utils/umami/varighet';
import { hentFeilmeldingerForForm } from 'lib/utils/formerrors';
import { hentPerioderSomTrengerVurdering, trengerVurderingsForslag } from 'lib/utils/periodisering';
import { gyldigDatoEllerNull } from 'lib/validation/dateValidation';
import { SubmitEventHandler } from 'react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';

import { parseDatoFraDatePickerOgTrekkFra1Dag } from 'components/behandlinger/oppholdskrav/oppholdskrav-utils';
import { RelevantInformasjonStudent } from 'components/behandlinger/sykdom/student/studentvurdering/RelevantInformasjonStudent';
import { StudentVurderingFelter } from 'components/behandlinger/sykdom/student/studentvurdering/StudentVurderingFelter';
import { VedtattStudentVurderinger } from 'components/behandlinger/sykdom/student/studentvurdering/VedtattStudentVurderinger';
import { VurderingStatus } from 'components/periodisering/VurderingStatusTag';
import {
  NyVurderingExpandableCard,
  skalVæreInitiellEkspandert,
} from 'components/periodisering/nyvurderingexpandablecard/NyVurderingExpandableCard';
import { TidligereVurderingExpandableCard } from 'components/periodisering/tidligerevurderingexpandablecard/TidligereVurderingExpandableCard';
import { VilkårskortPeriodisert } from 'components/vilkårskort/vilkårskortperiodisert/VilkårskortPeriodisert';
import { useLøsAvklaringsbehov } from 'hooks/saksbehandling/løsavklaringsbehov/useLøsAvklaringsbehov';

interface Props {
  behandlingVersjon: number;
  grunnlag: StudentGrunnlag;
  readOnly: boolean;
  initialMellomlagretVurdering?: MellomlagretVurdering;
}

export interface StudentFormFields {
  vurderinger: StudentVurdering[];
}

export interface StudentVurdering extends VurderingFormMeta {
  fraDato: string;
  begrunnelse: string;
  harAvbruttStudie?: string;
  godkjentStudieAvLånekassen?: string;
  avbruttPgaSykdomEllerSkade?: string;
  harBehovForBehandling?: string;
  avbruttDato?: string;
  avbruddMerEnn6Måneder?: string;
}

type DraftFormFields = Partial<StudentFormFields>;

export const StudentVurdering = ({ readOnly, initialMellomlagretVurdering, grunnlag, behandlingVersjon }: Props) => {
  const { behandlingsreferanse } = useParamsMedType();

  const { accordionsSignal, closeAllAccordions } = useAccordionsSignal();

  const {
    løsPeriodisertAvklaringsbehov,
    løsAvklaringsbehovIsLoading,
    løsAvklaringsbehovError,
    løsAvklaringsbehovStatus,
  } = useLøsAvklaringsbehov('AVKLAR_STUDENT_V2');

  const defaultValues: DraftFormFields = initialMellomlagretVurdering
    ? parseOgMigrerMellomlagring(initialMellomlagretVurdering.data)
    : mapVurderingToDraftFormFields(grunnlag);

  const form = useForm<StudentFormFields>({ defaultValues, shouldUnregister: true });

  const { fields: nyeVurderinger, remove, append } = useFieldArray({ control: form.control, name: 'vurderinger' });

  const { visningModus, visningActions, formReadOnly, erAktivUtenAvbryt } = useVilkårskortVisning(
    readOnly,
    'AVKLAR_STUDENT_V2',
    initialMellomlagretVurdering
  );
  const umamiStartTidspunkt = useUmamiStartTidspunkt(visningModus);

  const { mellomlagretVurdering, nullstillMellomlagretVurdering, slettMellomlagring } = useMellomlagring(
    Behovstype.AVKLAR_STUDENT_KODE_V2,
    initialMellomlagretVurdering,
    form
  );

  const handleSubmit: SubmitEventHandler = (event) => {
    form.handleSubmit((data) => {
      const løsning: AvklarPeriodisertStudentLøsning[] = data.vurderinger.map((vurdering, index) => {
        const isLast = index === data.vurderinger.length - 1;
        const tilDato = isLast ? undefined : parseDatoFraDatePickerOgTrekkFra1Dag(data.vurderinger[index + 1].fraDato);

        return {
          fom: formaterDatoForBackend(parse(vurdering.fraDato, 'dd.MM.yyyy', new Date())),
          tom: tilDato ? formaterDatoForBackend(tilDato) : undefined,
          begrunnelse: vurdering.begrunnelse,
          harAvbruttStudie: vurdering.harAvbruttStudie === JaEllerNei.Ja,
          avbruttStudieDato:
            vurdering.avbruttDato && formaterDatoForBackend(parse(vurdering.avbruttDato, 'dd.MM.yyyy', new Date())),
          harBehovForBehandling: vurdering.harBehovForBehandling
            ? vurdering.harBehovForBehandling === JaEllerNei.Ja
            : undefined,
          avbruddMerEnn6Måneder: vurdering.avbruddMerEnn6Måneder
            ? vurdering.avbruddMerEnn6Måneder === JaEllerNei.Ja
            : undefined,
          avbruttPgaSykdomEllerSkade: vurdering.avbruttPgaSykdomEllerSkade
            ? vurdering.avbruttPgaSykdomEllerSkade === JaEllerNei.Ja
            : undefined,
          godkjentStudieAvLånekassen: vurdering.godkjentStudieAvLånekassen
            ? vurdering.godkjentStudieAvLånekassen === JaEllerNei.Ja
            : undefined,
        };
      });

      løsPeriodisertAvklaringsbehov(
        {
          behandlingVersjon: behandlingVersjon,
          behov: {
            behovstype: Behovstype.AVKLAR_STUDENT_KODE_V2,
            løsningerForPerioder: løsning,
          },
          referanse: behandlingsreferanse,
        },
        () => {
          loggUmamiVarighet('STEG_AVKLAR_STUDENT_V2_VARIGHET', umamiStartTidspunkt, Date.now());
          nullstillMellomlagretVurdering();
          visningActions.onBekreftClick();
          closeAllAccordions();
        }
      );
    })(event);
  };

  const errorList = hentFeilmeldingerForForm(form.formState.errors);
  const sistevedtatteVurderinger = grunnlag.sisteVedtatteVurderinger;
  const finnesSisteVedtatteVurderinger = sistevedtatteVurderinger && sistevedtatteVurderinger?.length > 0;

  const foersteNyePeriode = nyeVurderinger.length > 0 ? form.watch('vurderinger.0.fraDato') : null;

  return (
    <VilkårskortPeriodisert
      onDeleteMellomlagringClick={() => slettMellomlagring(() => form.reset(mapVurderingToDraftFormFields(grunnlag)))}
      mellomlagretVurdering={mellomlagretVurdering}
      visningModus={visningModus}
      visningActions={visningActions}
      onLeggTilVurdering={() => append(emptyStudentVurdering())}
      errorList={errorList}
      heading={'§ 11-14 Student'}
      steg={'AVKLAR_STUDENT'}
      onSubmit={handleSubmit}
      isLoading={løsAvklaringsbehovIsLoading}
      status={løsAvklaringsbehovStatus}
      løsBehovOgGåTilNesteStegError={løsAvklaringsbehovError}
      vilkårTilhørerNavKontor={false}
      formReset={() => form.reset()}
    >
      <VStack gap={'space-16'}>
        <RelevantInformasjonStudent opplysninger={grunnlag.oppgittStudent} />

        {sistevedtatteVurderinger?.map((vurdering, index) => {
          return (
            <TidligereVurderingExpandableCard
              key={index}
              fom={new Dato(vurdering.fom).dato}
              tom={vurdering.tom && !erUendeligSlutt(vurdering.tom) ? new Dato(vurdering.tom).dato : undefined}
              førsteNyePeriodeFraDato={foersteNyePeriode != null ? parseDatoFraDatePicker(foersteNyePeriode) : null}
              vurderingStatus={hentVurderingStatusForVedtattVurdering(vurdering)}
              vurderingerMeta={vurdering.vurderingerMeta}
            >
              <VedtattStudentVurderinger vurdering={vurdering} />
            </TidligereVurderingExpandableCard>
          );
        })}

        <FormProvider {...form}>
          {nyeVurderinger.map((vurdering, index) => {
            const vurderingValues = form.watch(`vurderinger.${index}`);
            const nesteVurderingValues = form.watch(`vurderinger.${index + 1}`);

            return (
              <NyVurderingExpandableCard
                key={vurdering.id}
                fraDato={gyldigDatoEllerNull(vurderingValues?.fraDato)}
                nestePeriodeFraDato={gyldigDatoEllerNull(nesteVurderingValues?.fraDato)}
                isLast={index === nyeVurderinger.length - 1}
                vurdering={vurdering}
                finnesFeil={errorList.length > 0}
                readonly={formReadOnly}
                onSlettVurdering={() => remove(index)}
                index={index}
                harTidligereVurderinger={finnesSisteVedtatteVurderinger}
                accordionsSignal={accordionsSignal}
                initiellEkspandert={skalVæreInitiellEkspandert(vurdering.erNyVurdering, erAktivUtenAvbryt)}
                vurderingStatus={hentVurderingStatus(vurderingValues)}
              >
                <StudentVurderingFelter index={index} readOnly={formReadOnly} />
              </NyVurderingExpandableCard>
            );
          })}
        </FormProvider>
      </VStack>
    </VilkårskortPeriodisert>
  );

  function mapVurderingToDraftFormFields(grunnlag: StudentGrunnlag): DraftFormFields {
    if (trengerVurderingsForslag(grunnlag)) {
      return hentPerioderSomTrengerVurdering(grunnlag, () => emptyStudentVurdering());
    }

    return {
      vurderinger: grunnlag.nyeVurderinger?.map((vurdering) => {
        return {
          fraDato: vurdering?.fom ? new Dato(vurdering.fom).formaterForFrontend() : '',
          begrunnelse: vurdering?.begrunnelse || '',
          harAvbruttStudie: getJaNeiEllerUndefined(vurdering?.harAvbruttStudie),
          godkjentStudieAvLånekassen: getJaNeiEllerUndefined(vurdering?.godkjentStudieAvLånekassen),
          avbruttPgaSykdomEllerSkade: getJaNeiEllerUndefined(vurdering?.avbruttPgaSykdomEllerSkade),
          harBehovForBehandling: getJaNeiEllerUndefined(vurdering?.harBehovForBehandling),
          avbruddMerEnn6Måneder: getJaNeiEllerUndefined(vurdering?.avbruddMerEnn6Måneder),
          avbruttDato: vurdering?.avbruttStudieDato
            ? new Dato(vurdering.avbruttStudieDato).formaterForFrontend()
            : undefined,
          vurderingerMeta: vurdering.vurderingerMeta,
          erNyVurdering: false,
          behøverVurdering: false,
        };
      }),
    };
  }
};

function emptyStudentVurdering(): StudentVurdering {
  return {
    fraDato: '',
    begrunnelse: '',
    avbruddMerEnn6Måneder: '',
    avbruttDato: '',
    avbruttPgaSykdomEllerSkade: '',
    godkjentStudieAvLånekassen: '',
    harAvbruttStudie: '',
    harBehovForBehandling: '',
    erNyVurdering: true,
    behøverVurdering: false,
  };
}

function hentVurderingStatus(
  values?: StudentVurdering
): VurderingStatus.Oppfylt | VurderingStatus.IkkeOppfylt | undefined {
  if (!values) return undefined;

  return utledStatus(
    [
      values.harAvbruttStudie,
      values.godkjentStudieAvLånekassen,
      values.avbruttPgaSykdomEllerSkade,
      values.harBehovForBehandling,
      values.avbruddMerEnn6Måneder,
    ],
    JaEllerNei.Ja,
    JaEllerNei.Nei
  );
}

function hentVurderingStatusForVedtattVurdering(
  values: StudentVurderingResponse
): VurderingStatus.Oppfylt | VurderingStatus.IkkeOppfylt | undefined {
  if (!values) {
    return undefined;
  }

  return utledStatus(
    [
      values.harAvbruttStudie,
      values.godkjentStudieAvLånekassen,
      values.avbruttPgaSykdomEllerSkade,
      values.harBehovForBehandling,
      values.avbruddMerEnn6Måneder,
    ],
    true,
    false
  );
}

function utledStatus<T extends string | boolean>(
  felt: (T | undefined | null)[],
  oppfyltVerdi: T,
  ikkeOppfyltVerdi: T
): VurderingStatus.Oppfylt | VurderingStatus.IkkeOppfylt | undefined {
  for (const feltVerdi of felt) {
    if (feltVerdi === ikkeOppfyltVerdi) {
      return VurderingStatus.IkkeOppfylt;
    }

    if (feltVerdi !== oppfyltVerdi) {
      return undefined;
    }
  }

  return VurderingStatus.Oppfylt;
}

function parseOgMigrerMellomlagring(mellomlagring: string): DraftFormFields {
  const parsedData = JSON.parse(mellomlagring);
  if (erPeriodisertVersjon(parsedData)) {
    return parsedData;
  } else {
    return {
      vurderinger: [
        {
          ...parsedData,
        },
      ],
    };
  }
}

function erPeriodisertVersjon(object: unknown): object is StudentFormFields {
  return typeof object === 'object' && object !== null && 'vurderinger' in object && object.vurderinger != null;
}
