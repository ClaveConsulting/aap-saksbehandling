import { hentMellomlagring, hentStudentGrunnlag } from 'lib/services/saksbehandlingservice/saksbehandlingService';
import { isError } from 'lib/utils/api';
import { Behovstype } from 'lib/utils/form';
import { StegData, skalViseSteg } from 'lib/utils/steg';

import { StudentVurderingV2 } from 'components/behandlinger/sykdom/student/studentvurdering/StudentVurderingV2';
import { ApiException } from 'components/saksbehandling/apiexception/ApiException';

interface Props {
  behandlingsreferanse: string;
  stegData: StegData;
}

export const StudentvurderingMedDataFetching = async ({ behandlingsreferanse, stegData }: Props) => {
  const grunnlag = await hentStudentGrunnlag(behandlingsreferanse);

  if (isError(grunnlag)) {
    return <ApiException apiResponses={[grunnlag]} />;
  }

  if (!skalViseSteg(stegData, grunnlag.data.sisteVedtatteVurderinger != null)) {
    return null;
  }

  const totalReadOnly = stegData.readOnly || !grunnlag.data.harTilgangTilÅSaksbehandle;
  const behovstype = Behovstype.AVKLAR_STUDENT_KODE_V2;
  const initialMellomlagretVurdering = await hentMellomlagring(
    behandlingsreferanse,
    behovstype,
    totalReadOnly,
    stegData.erIkkePåVent
  );

  return (
    <StudentVurderingV2
      grunnlag={grunnlag.data}
      readOnly={stegData.readOnly || !grunnlag.data.harTilgangTilÅSaksbehandle}
      behandlingVersjon={stegData.behandlingVersjon}
      initialMellomlagretVurdering={initialMellomlagretVurdering}
    />
  );
};
