import { MainLayout } from "../../Components/MainLayout";
import TestMarksUpload from "../../Components/TestMarks/TestMarksUpload";

export default function SM_TestMarks({ userCentre, isCustomCentre = false, ...layoutProps }) {
  return (
    <MainLayout {...layoutProps} roleLabel="SATHEE MITRA PORTAL">
      <TestMarksUpload mitraCentre={userCentre} isCustomCentre={isCustomCentre} />
    </MainLayout>
  );
}