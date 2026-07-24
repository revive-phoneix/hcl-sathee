import AdminAnalytics from "./AdminAnalytics";

/** HCL Partner analytics — view only (no mentor edit). */
export default function HCLPartnerAnalytics(props) {
  return <AdminAnalytics {...props} readOnly roleLabel="Partner Portal" />;
}
