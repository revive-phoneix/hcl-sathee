import AdminAnalytics from "./AdminAnalytics";

export default function SM_Analytics(props) {
  return (
    <AdminAnalytics
      {...props}
      roleLabel="SATHEE MITRA PORTAL"
      showMentors={false}
      allowAddEquipment={false}
    />
  );
}
