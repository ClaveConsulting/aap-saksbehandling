import { StegSuspense } from 'components/stegsuspense/StegSuspense';
import { SykdomsvurderingMedDataFetching } from 'components/behandlinger/sykdom/sykdomsvurdering/SykdomsvurderingMedDataFetching';
import { hentYrkesskadeVurderingGrunnlag } from 'lib/services/saksbehandlingservice/saksbehandlingService';
import { getAvklaringsbehovForSteg, getStegData } from 'lib/utils/steg';
import { BistandsbehovMedDataFetching } from 'components/behandlinger/sykdom/bistandsbehov/BistandsbehovMedDataFetching';
import { MeldepliktMedDataFetching } from 'components/behandlinger/sykdom/meldeplikt/MeldepliktMedDataFetching';
import { SykepengeerstatningMedDataFetching } from 'components/behandlinger/sykdom/vurdersykepengeerstatning/SykepengeerstatningMedDataFetching';
import { FastsettArbeidsevneMedDataFetching } from 'components/behandlinger/sykdom/fastsettarbeidsevne/FastsettArbeidsevneMedDataFetching';
import { GruppeSteg } from 'components/gruppesteg/GruppeSteg';
import { YrkesskadeMedDataFetching } from 'components/behandlinger/sykdom/yrkesskade/YrkesskadeMedDataFetching';
import { RefusjonMedDataFetching } from 'components/behandlinger/sykdom/refusjon/RefusjonMedDataFetching';
import { isError } from 'lib/utils/api';
import { ApiException } from 'components/saksbehandling/apiexception/ApiException';
import { SykdomsvurderingBrevMedDataFetching } from 'components/behandlinger/sykdom/sykdomsvurderingbrev/SykdomsvurderingBrevMedDataFetching';
import { OvergangUforeMedDataFetching } from './overgangufore/OvergangUforeMedDataFetching';
import { OvergangArbeidMedDataFetching } from './overgangarbeid/OvergangArbeidMedDataFetching';
import { ArbeidsopptrappingMedDataFetching } from 'components/behandlinger/sykdom/arbeidsopptrapping/ArbeidsopptrappingMedDataFetching';
import { EtableringAvEgenVirksomhetMedDatafetching } from 'components/behandlinger/sykdom/etableringegenvirksomhet/EtableringAvEgenVirksomhetMedDatafetching';
import { Behovstype } from 'lib/utils/form';
import { BehandlingFlytOgTilstand, StegGruppe } from 'lib/types/types';
import { BekreftVurderingerOppfølgingMedDataFetching } from 'components/behandlinger/sykdom/bekreftvurderingeroppfølging/BekreftVurderingerOppfølgingMedDataFetching';
import { OppgittYrkesskadeUtenRegistertreffInfo } from 'components/behandlinger/sykdom/yrkesskade/OppgittYrkesskadeUtenRegistertreffInfo';
import { StudentvurderingMedDataFetching } from 'components/behandlinger/sykdom/student/studentvurdering/StudentvurderingMedDataFetching';
import { unleashService } from 'lib/services/unleash/unleashService';

interface Props {
  behandlingsreferanse: string;
  flyt: BehandlingFlytOgTilstand;
}

export const Sykdom = async ({ behandlingsreferanse, flyt }: Props) => {
  const yrkesskadeVurderingGrunnlag = await hentYrkesskadeVurderingGrunnlag(behandlingsreferanse);

  if (isError(yrkesskadeVurderingGrunnlag)) {
    return <ApiException apiResponses={[yrkesskadeVurderingGrunnlag]} />;
  }

  const aktivStegGruppe = 'SYKDOM';
  const sykdomSteg = getStegData(aktivStegGruppe, 'AVKLAR_SYKDOM', flyt);
  const vurderBistandsbehovSteg = getStegData(aktivStegGruppe, 'VURDER_BISTANDSBEHOV', flyt);
  const arbeidsopptrappingSteg = getStegData(aktivStegGruppe, 'ARBEIDSOPPTRAPPING', flyt);
  const fritakMeldepliktSteg = getStegData(aktivStegGruppe, 'FRITAK_MELDEPLIKT', flyt);
  const etableringAvEgenVirksomhetSteg = getStegData(aktivStegGruppe, 'ETABLERING_EGEN_VIRKSOMHET', flyt);
  const fastsettArbeidsevneSteg = getStegData(aktivStegGruppe, 'FASTSETT_ARBEIDSEVNE', flyt);
  const refusjonskravSteg = getStegData(aktivStegGruppe, 'REFUSJON_KRAV', flyt);
  const sykdomsvurderingBrevSteg = getStegData(aktivStegGruppe, 'SYKDOMSVURDERING_BREV', flyt);
  const bekreftVurderingerOppfølgingSteg = getStegDataForBekreftVurderingerOppfølgingSteg(aktivStegGruppe, flyt);
  const vurderYrkesskadeSteg = getStegData(aktivStegGruppe, 'VURDER_YRKESSKADE', flyt);
  const vurderStudentStegV2 = getStegData(aktivStegGruppe, 'AVKLAR_STUDENT_V2', flyt);
  const vurderSykepengeerstatningSteg = getStegData(aktivStegGruppe, 'VURDER_SYKEPENGEERSTATNING', flyt);
  const overganguføreSteg = getStegData(aktivStegGruppe, 'OVERGANG_UFORE', flyt);
  const overgangarbeidSteg = getStegData(aktivStegGruppe, 'OVERGANG_ARBEID', flyt);
  const oppgittYrkesskadeInfoSteg = hentStegDataForOppgittYrkesskadeInfo(yrkesskadeVurderingGrunnlag.data);

  const skalViseAlleSykdomSteg = unleashService.isEnabled('SkalViseAlleSykdomssteg');

  return (
    <GruppeSteg
      behandlingReferanse={behandlingsreferanse}
      behandlingVersjon={flyt.behandlingVersjon}
      prosessering={flyt.prosessering}
      visning={flyt.visning}
      aktivtSteg={flyt.aktivtSteg}
    >
      {sykdomSteg.skalViseSteg && (
        <StegSuspense>
          <SykdomsvurderingMedDataFetching
            behandlingsreferanse={behandlingsreferanse}
            stegData={sykdomSteg}
            skalViseAlleSykdomsSteg={skalViseAlleSykdomSteg}
          />
        </StegSuspense>
      )}
      {vurderBistandsbehovSteg.skalViseSteg && (
        <StegSuspense>
          <BistandsbehovMedDataFetching
            behandlingsreferanse={behandlingsreferanse}
            stegData={vurderBistandsbehovSteg}
          />
        </StegSuspense>
      )}
      {fritakMeldepliktSteg.skalViseSteg && (
        <StegSuspense>
          <MeldepliktMedDataFetching behandlingsreferanse={behandlingsreferanse} stegData={fritakMeldepliktSteg} />
        </StegSuspense>
      )}
      {etableringAvEgenVirksomhetSteg.skalViseSteg && (
        <StegSuspense>
          <EtableringAvEgenVirksomhetMedDatafetching
            behandlingsreferanse={behandlingsreferanse}
            stegData={etableringAvEgenVirksomhetSteg}
          />
        </StegSuspense>
      )}
      {fastsettArbeidsevneSteg.skalViseSteg && (
        <StegSuspense>
          <FastsettArbeidsevneMedDataFetching
            behandlingsreferanse={behandlingsreferanse}
            stegData={fastsettArbeidsevneSteg}
          />
        </StegSuspense>
      )}
      {arbeidsopptrappingSteg.skalViseSteg && (
        <StegSuspense>
          <ArbeidsopptrappingMedDataFetching
            behandlingsreferanse={behandlingsreferanse}
            stegData={arbeidsopptrappingSteg}
          />
        </StegSuspense>
      )}

      <StegSuspense>
        <OvergangUforeMedDataFetching behandlingsreferanse={behandlingsreferanse} stegData={overganguføreSteg} />
      </StegSuspense>

      <StegSuspense>
        <OvergangArbeidMedDataFetching behandlingsreferanse={behandlingsreferanse} stegData={overgangarbeidSteg} />
      </StegSuspense>

      {refusjonskravSteg.skalViseSteg && (
        <StegSuspense>
          <RefusjonMedDataFetching behandlingsreferanse={behandlingsreferanse} stegData={refusjonskravSteg} />
        </StegSuspense>
      )}
      {sykdomsvurderingBrevSteg.skalViseSteg && (
        <StegSuspense>
          <SykdomsvurderingBrevMedDataFetching
            behandlingsreferanse={behandlingsreferanse}
            stegData={sykdomsvurderingBrevSteg}
          />
        </StegSuspense>
      )}
      {bekreftVurderingerOppfølgingSteg.skalViseSteg && !bekreftVurderingerOppfølgingSteg.readOnly && (
        <StegSuspense>
          <BekreftVurderingerOppfølgingMedDataFetching
            behandlingsreferanse={behandlingsreferanse}
            behandlingVersjon={bekreftVurderingerOppfølgingSteg.behandlingVersjon}
            readOnly={bekreftVurderingerOppfølgingSteg.readOnly}
          />
        </StegSuspense>
      )}
      {vurderYrkesskadeSteg.skalViseSteg && (
        <StegSuspense>
          <YrkesskadeMedDataFetching behandlingsreferanse={behandlingsreferanse} stegData={vurderYrkesskadeSteg} />
        </StegSuspense>
      )}
      {oppgittYrkesskadeInfoSteg.skalViseSteg && !vurderYrkesskadeSteg.skalViseSteg && (
        <StegSuspense>
          <OppgittYrkesskadeUtenRegistertreffInfo grunnlag={yrkesskadeVurderingGrunnlag.data} />
        </StegSuspense>
      )}
      {vurderStudentStegV2.skalViseSteg && (
        <StegSuspense>
          <StudentvurderingMedDataFetching behandlingsreferanse={behandlingsreferanse} stegData={vurderStudentStegV2} />
        </StegSuspense>
      )}
      {vurderSykepengeerstatningSteg.skalViseSteg && (
        <StegSuspense>
          <SykepengeerstatningMedDataFetching
            behandlingsreferanse={behandlingsreferanse}
            stegData={vurderSykepengeerstatningSteg}
          />
        </StegSuspense>
      )}
    </GruppeSteg>
  );
};

export function hentStegDataForOppgittYrkesskadeInfo(grunnlag: {
  opplysninger: { oppgittYrkesskadeISøknad?: boolean | null; innhentedeYrkesskader: unknown[] };
  yrkesskadeVurdering?: unknown;
}) {
  const oppgittYrkesskadeISøknad = grunnlag.opplysninger.oppgittYrkesskadeISøknad;
  const harIngenYrkesskadeId = grunnlag.yrkesskadeVurdering == null;
  const harIngenInnhentetYrkesskade =
    grunnlag.opplysninger.innhentedeYrkesskader == null || grunnlag.opplysninger.innhentedeYrkesskader.length === 0;

  return {
    skalViseSteg: oppgittYrkesskadeISøknad === true && harIngenYrkesskadeId && harIngenInnhentetYrkesskade,
    readOnly: true,
  };
}

export function getStegDataForBekreftVurderingerOppfølgingSteg(
  aktivStegGruppe: StegGruppe,
  flyt: BehandlingFlytOgTilstand
) {
  const avklaringsbehov = getAvklaringsbehovForSteg(
    aktivStegGruppe,
    'BEKREFT_VURDERINGER_OPPFØLGING',
    flyt,
    Behovstype.BEKREFT_VURDERINGER_OPPFØLGING
  );

  const harAvklaringsbehov = avklaringsbehov.length > 0;
  const typeBehandling = flyt.visning.typeBehandling;
  const readOnly = flyt.visning.saksbehandlerReadOnly || (typeBehandling === 'Revurdering' && !harAvklaringsbehov);

  const harÅpentAvklaringsbehov = avklaringsbehov.some(
    (avklaringsbehov) => avklaringsbehov.endringer[avklaringsbehov.endringer.length - 1]?.status === 'OPPRETTET'
  );

  return {
    skalViseSteg: harÅpentAvklaringsbehov,
    readOnly: readOnly,
    behandlingVersjon: flyt.behandlingVersjon,
  };
}
