import { motion } from "framer-motion";
import { Star, Quote, ExternalLink } from "lucide-react";
import { SectionHeading } from "./Branches";
import { useGoogleReviews } from "@/hooks/useGoogleReviews";
import { useI18n } from "@/i18n/I18nProvider";
import type { GoogleReviewDto } from "@/hooks/useGoogleReviews";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-primary text-primary" : "fill-muted text-muted"}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, index }: { review: GoogleReviewDto; index: number }) {
  const text =
    review.text.length > 220 ? review.text.slice(0, 220).trimEnd() + "…" : review.text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="relative flex flex-col gap-4 rounded-3xl border bg-card p-7 shadow-soft"
    >
      <Quote className="absolute right-6 top-6 h-8 w-8 text-primary/10" />

      <StarRow rating={review.rating} />

      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{text}</p>

      <div className="flex items-center gap-3 border-t pt-4">
        {review.authorPhotoUrl ? (
          <img
            src={review.authorPhotoUrl}
            alt={review.authorName}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full gradient-primary text-primary-foreground text-sm font-bold">
            {review.authorName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate font-semibold text-sm">{review.authorName}</div>
          <div className="text-xs text-muted-foreground">{review.relativeTime}</div>
        </div>
        <div className="ml-auto shrink-0">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-label="Google">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

function AggregateScore({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-display text-6xl font-bold text-gradient">{rating.toFixed(1)}</div>
      <StarRow rating={Math.round(rating)} />
      <div className="mt-1 text-sm text-muted-foreground">{count.toLocaleString()} reviews on Google</div>
    </div>
  );
}

export function Testimonials() {
  const { t } = useI18n();
  const { data, isLoading, isError } = useGoogleReviews();

  if (isLoading || isError || !data || data.reviews.length === 0) return null;

  const placeUrl = `https://search.google.com/local/reviews?placeid=ChIJcS9ZcV9SUkYR6VBtuoSlLz4`;

  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-16">

          {/* Left: heading + aggregate score */}
          <div className="flex flex-col items-center gap-8 lg:w-64 lg:shrink-0 lg:items-start">
            <SectionHeading
              center={false}
              eyebrow={t("home.reviews.eyebrow")}
              title={t("home.reviews.title")}
              subtitle={t("home.reviews.subtitle")}
            />
            <AggregateScore rating={data.rating} count={data.userRatingCount} />
            <a
              href={placeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {t("home.reviews.seeAll")} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Right: review cards grid */}
          <div className="flex-1 grid gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {data.reviews.map((review, i) => (
              <ReviewCard key={i} review={review} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
