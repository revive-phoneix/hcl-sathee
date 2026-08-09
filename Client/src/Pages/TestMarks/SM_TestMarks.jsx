import { MainLayout } from "../../Components/MainLayout";
import TestMarksUpload from "../../Components/TestMarks/TestMarksUpload";

export default function SM_TestMarks({ userCentre, ...layoutProps }) {
  return (
    <MainLayout {...layoutProps} roleLabel="Sathee Mitra Portal">
      <TestMarksUpload mitraCentre={userCentre} />
    </MainLayout>
  );
}