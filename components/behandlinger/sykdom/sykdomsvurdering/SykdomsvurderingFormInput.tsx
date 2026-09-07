'use client';

import { Radio, VStack } from '@navikt/ds-react';
import { Sak } from 'context/saksbehandling/SakContext';
import { parse } from 'date-fns';
import { Periode, StudentGrunnlag } from 'lib/types/types';
import { stringToDate } from 'lib/utils/date';
import { JaEllerNei, JaNeiEllerForbigåendeTekst } from 'lib/utils/form';
import { erDatoIPeriode, validerDato } from 'lib/validation/dateValidation';
import React from 'react';
import { UseFormReturn } from 'react-hook-form';

import { Alert } from 'components/alert/Alert';
import { RelevantInformasjonStudent } from 'components/behandlinger/sykdom/student/studentvurdering/RelevantInformasjonStudent';
import type { SykdomsvurderingerForm } from 'components/behandlinger/sykdom/sykdomsvurdering/Sykdomsvurdering';
import { SykdomsvurderingDiagnosesøk } from 'components/behandlinger/sykdom/sykdomsvurdering/SykdomsvurderingDiagnosesøk';
import { SykdomsvurderingNedsattArbeidsevneDetaljer } from 'components/behandlinger/sykdom/sykdomsvurdering/SykdomsvurderingNedsattArbeidsevneDetaljer';
import { DiagnoserDefaultOptions } from 'components/behandlinger/sykdom/sykdomsvurdering/diagnoseUtil';
import { defaultBegrunnelse } from 'components/behandlinger/sykdom/sykdomsvurdering/sykdomsvurdering-utils';
import { DateInputWrapper } from 'components/form/dateinputwrapper/DateInputWrapper';
import { RadioGroupJaNei } from 'components/form/radiogroupjanei/RadioGroupJaNei';
import { RadioGroupWrapper } from 'components/form/radiogroupwrapper/RadioGroupWrapper';
import { TextAreaWrapper } from 'components/form/textareawrapper/TextAreaWrapper';
import { HvordanLeggeTilSluttdatoReadMore } from 'components/hvordanleggetilsluttdatoreadmore/HvordanLeggeTilSluttdatoReadMore';

interface Props {
  index: number;
  form: UseFormReturn<SykdomsvurderingerForm>;
  readonly: boolean;
  ikkeRelevantePerioder?: Periode[];
  sak: Sak;
  skalVurdereYrkesskade: boolean;
  erÅrsakssammenhengYrkesskade: boolean;
  rettighetsperiodeStartdato: Date;
  diagnoseDefaultOptions: DiagnoserDefaultOptions;
  studentgrunnlag: StudentGrunnlag;
  skalViseAlleSykdomsSteg: boolean;
}

export const vilkårsvurderingLabel = 'Vilkårsvurdering';
export const harSkadeSykdomEllerLyteLabel = 'Har brukeren sykdom, skade eller lyte?';
export const harNedsattArbeidsevneLabel = 'Har brukeren nedsatt arbeidsevne?';
export const erNedsettelseIArbeidsevneMerEnnHalvpartenLabel = 'Er arbeidsevnen nedsatt med minst halvparten?';
export const yrkesskadeBegrunnelse = '§ 11-22 AAP ved yrkesskade';
export const erNedsettelseIArbeidsevneMerEnnYrkesskadeGrense = 'Er arbeidsevnen nedsatt med minst 30 prosent?';
export const erSkadeSykdomEllerLyteVesentligdelLabel =
  'Er sykdom, skade eller lyte vesentlig medvirkende til at arbeidsevnen er nedsatt?';

export const SykdomsvurderingFormInput = ({
  erÅrsakssammenhengYrkesskade,
  skalVurdereYrkesskade,
  index,
  form,
  readonly,
  ikkeRelevantePerioder,
  rettighetsperiodeStartdato,
  diagnoseDefaultOptions,
  studentgrunnlag,
  skalViseAlleSykdomsSteg,
}: Props) => {
  const harNedsattArbeidsevne = form.watch(`vurderinger.${index}.harNedsattArbeidsevne`);
  const skalViseNedsettelse = harNedsattArbeidsevne === 'JA' || harNedsattArbeidsevne === 'JA_FORBIGÅENDE_PROBLEMER';
  const skalViseStudentSoknad =
    studentgrunnlag.oppgittStudent?.erStudentStatus === 'AVBRUTT' &&
    (studentgrunnlag.oppgittStudent?.skalGjenopptaStudieStatus === 'JA' ||
      studentgrunnlag.oppgittStudent?.skalGjenopptaStudieStatus === 'VET_IKKE');

  return (
    <VStack gap={'space-20'}>
      <DateInputWrapper
        name={`vurderinger.${index}.fraDato`}
        label="Vurderingen gjelder fra"
        control={form.control}
        rules={{
          required: 'Vennligst velg en dato for når vurderingen gjelder fra',
          validate: {
            validerDato: (value) => validerDato(value as string),
            validerIkkeRelevantPeriode: (value) => {
              const parsedInputDato = new Date(parse(value as string, 'dd.MM.yyyy', new Date()));
              const funnetIkkeRelevantPeriode = ikkeRelevantePerioder?.find((periode) => {
                const fom = stringToDate(periode.fom);
                const tom = stringToDate(periode.tom);
                if (!fom || !tom) return false;
                return erDatoIPeriode(parsedInputDato, fom, tom);
              });

              return funnetIkkeRelevantPeriode
                ? `Dato kan ikke være inne i perioden (${funnetIkkeRelevantPeriode.fom} - ${funnetIkkeRelevantPeriode.tom})`
                : true;
            },
          },
        }}
        readOnly={readonly}
      />
      <HvordanLeggeTilSluttdatoReadMore />
      <TextAreaWrapper
        name={`vurderinger.${index}.begrunnelse`}
        control={form.control}
        label={vilkårsvurderingLabel}
        description={`Skriv en vurdering som svarer på de fire vilkårene i § 11-5`}
        rules={{
          required: 'Du må gjøre en vilkårsvurdering',
          validate: {
            kanIkkeVæreDefaultBegrunnelse: (value) =>
              (value as string).trim() !== defaultBegrunnelse.trim() || 'Du må skrive en egen vilkårsvurdering',
          },
        }}
        readOnly={readonly}
      />
      <RadioGroupJaNei
        name={`vurderinger.${index}.harSkadeSykdomEllerLyte`}
        control={form.control}
        label={harSkadeSykdomEllerLyteLabel}
        horisontal={true}
        rules={{ required: 'Du må svare på om brukeren har sykdom, skade eller lyte' }}
        readOnly={readonly}
      />
      {form.watch(`vurderinger.${index}.harSkadeSykdomEllerLyte`) === JaEllerNei.Ja && (
        <>
          <SykdomsvurderingDiagnosesøk
            index={index}
            form={form}
            readOnly={readonly}
            diagnoseDefaultOptions={diagnoseDefaultOptions}
          />
          {skalViseStudentSoknad && <RelevantInformasjonStudent opplysninger={studentgrunnlag.oppgittStudent} />}
          {!skalViseAlleSykdomsSteg && (
            <>
              <RadioGroupWrapper
                name={`vurderinger.${index}.harNedsattArbeidsevne`}
                control={form.control}
                label={harNedsattArbeidsevneLabel}
                rules={{ required: 'Du må svare på om brukeren har nedsatt arbeidsevne' }}
                readOnly={readonly}
                size={'small'}
              >
                <Radio value={'JA'}>{JaNeiEllerForbigåendeTekst.Ja}</Radio>
                <Radio value={'JA_FORBIGÅENDE_PROBLEMER'}>{JaNeiEllerForbigåendeTekst.Forbigående}</Radio>
                <Radio value={'NEI_MEN_STUDENT'}>{JaNeiEllerForbigåendeTekst.NeiMenStudent}</Radio>
                <Radio value={'NEI'}>{JaNeiEllerForbigåendeTekst.Nei}</Radio>
              </RadioGroupWrapper>

              {form.watch(`vurderinger.${index}.harNedsattArbeidsevne`) === 'NEI' && (
                <Alert variant={'info'} className={'fit-content'}>
                  Brukeren vil få vedtak om at de ikke har rett på AAP. De kvalifiserer ikke for sykepengeerstatning.
                </Alert>
              )}
              {skalViseNedsettelse && (
                <SykdomsvurderingNedsattArbeidsevneDetaljer
                  index={index}
                  form={form}
                  readonly={readonly}
                  rettighetsperiodeStartdato={rettighetsperiodeStartdato}
                  skalVurdereYrkesskade={skalVurdereYrkesskade}
                  erÅrsakssammenhengYrkesskade={erÅrsakssammenhengYrkesskade}
                  skalViseAlleSykdomSteg={skalViseAlleSykdomsSteg}
                />
              )}
            </>
          )}
        </>
      )}
      {skalViseAlleSykdomsSteg && (
        <>
          <RadioGroupWrapper
            name={`vurderinger.${index}.harNedsattArbeidsevne`}
            control={form.control}
            label={harNedsattArbeidsevneLabel}
            rules={{ required: 'Du må svare på om brukeren har nedsatt arbeidsevne' }}
            readOnly={readonly}
            size={'small'}
          >
            <Radio value={'JA'}>{JaNeiEllerForbigåendeTekst.Ja}</Radio>
            <Radio value={'JA_FORBIGÅENDE_PROBLEMER'}>{JaNeiEllerForbigåendeTekst.Forbigående}</Radio>
            <Radio value={'NEI_MEN_STUDENT'}>{JaNeiEllerForbigåendeTekst.NeiMenStudent}</Radio>
            <Radio value={'NEI'}>{JaNeiEllerForbigåendeTekst.Nei}</Radio>
          </RadioGroupWrapper>
          {form.watch(`vurderinger.${index}.harNedsattArbeidsevne`) === 'NEI' && (
            <Alert variant={'info'} className={'fit-content'}>
              Brukeren vil få vedtak om at de ikke har rett på AAP. De kvalifiserer ikke for sykepengeerstatning.
            </Alert>
          )}
          {skalViseNedsettelse && (
            <SykdomsvurderingNedsattArbeidsevneDetaljer
              index={index}
              form={form}
              readonly={readonly}
              rettighetsperiodeStartdato={rettighetsperiodeStartdato}
              skalVurdereYrkesskade={skalVurdereYrkesskade}
              erÅrsakssammenhengYrkesskade={erÅrsakssammenhengYrkesskade}
              skalViseAlleSykdomSteg={skalViseAlleSykdomsSteg}
            />
          )}
        </>
      )}
    </VStack>
  );
};
