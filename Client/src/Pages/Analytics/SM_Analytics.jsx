import AdminAnalytics from "./AdminAnalytics";

export default function SM_Analytics(props) {
  return (
    <AdminAnalytics
      {...props}
      roleLabel="Sathee Mitra Portal"
      showMentors={false}
      allowAddEquipment={false}
    />
  );
}
