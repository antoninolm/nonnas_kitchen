import { useParams } from "react-router-dom";
import { useAuthFetch } from "../hooks/useAuthFetch";
import { useTranslation } from "../hooks/useTranslation";
import Avatar from "../components/Avatar.jsx";
import RatingBadge from "../components/RatingBadge.jsx";
import ReviewList from "../components/ReviewList.jsx";

function UserProfile() {
  const { id } = useParams();
  const { t } = useTranslation();

  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
  } = useAuthFetch(`/api/v1/users/${id}`);

  const { data: reviewsData, loading: reviewsLoading } = useAuthFetch(
    `/api/v1/users/${id}/reviews`,
  );

  if (profileLoading)
    return <p className="p-4 text-text-secondary">{t("common.loading")}</p>;
  if (profileError)
    return (
      <p className="p-4 font-medium text-accent" role="alert">
        {t("common.error")}
      </p>
    );
  if (!profile) return null;

  const guestSinceYear = new Date(profile.createdAt).getFullYear();

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-section-y">
      <div className="mb-4 flex items-center gap-3 rounded-card border border-dashed border-border bg-surface p-card shadow-card">
        <Avatar src={profile.avatar} name={profile.name} size="lg" />
        <div className="min-w-0">
          <p className="m-0 font-semibold text-text-primary">{profile.name}</p>
          <p className="m-0 text-sm text-text-secondary">
            {t("userProfile.guestSince")} {guestSinceYear}
          </p>
          <RatingBadge avg={profile.ratingAvg} count={profile.ratingCount} />
        </div>
      </div>

      <h2 className="mt-8 mb-4">{t("userProfile.reviewsTitle")}</h2>
      {reviewsLoading && (
        <p className="text-text-secondary">{t("common.loading")}</p>
      )}
      {!reviewsLoading && reviewsData && (
        <ReviewList reviews={reviewsData.reviews} />
      )}
    </section>
  );
}

export default UserProfile;
