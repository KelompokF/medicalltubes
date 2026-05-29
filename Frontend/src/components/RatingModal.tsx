import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, Loader2, CheckCircle2, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reviewService } from "@/services/api";
import { toast } from "sonner";

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: string;
  doctorName: string;
  contextType: "consultation" | "home_visit";
  contextId: string;
  onSuccess?: () => void;
}

export default function RatingModal({
  open,
  onOpenChange,
  doctorId,
  doctorName,
  contextType,
  contextId,
  onSuccess,
}: RatingModalProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(t("patient.reviews.selectRating", "Pilih rating terlebih dahulu"));
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewService.submitReview({
        doctor_id: doctorId,
        rating,
        comment: comment.trim() || undefined,
        context_type: contextType,
        context_id: contextId,
      });
      setIsSuccess(true);
      toast.success(t("patient.reviews.reviewSubmitted", "Review berhasil dikirim!"));
      onSuccess?.();
      // Auto close after 2 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setRating(0);
        setComment("");
        onOpenChange(false);
      }, 2000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        t("patient.reviews.submitFailed", "Gagal mengirim review.");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const ratingLabels = [
    "",
    t("patient.reviews.ratingTerrible", "Sangat Buruk"),
    t("patient.reviews.ratingBad", "Buruk"),
    t("patient.reviews.ratingOkay", "Cukup"),
    t("patient.reviews.ratingGood", "Baik"),
    t("patient.reviews.ratingExcellent", "Sangat Baik"),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => !isSubmitting && onOpenChange(false)}
    >
      <div
        className="bg-background rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {isSuccess ? (
          /* Success State */
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              {t("patient.reviews.thankYou", "Terima Kasih!")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("patient.reviews.reviewRecorded", "Rating dan komentar Anda telah dicatat.")}
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-6 w-6 ${s <= rating ? "text-amber-500 fill-amber-500" : "text-slate-300"}`}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Rating Form */
          <>
            {/* Header */}
            <div className="relative bg-gradient-to-r from-primary/90 via-primary/70 to-primary/50 p-6 pb-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors rounded-full p-1"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-white">
                {t("patient.reviews.rateDoctor", "Beri Rating Dokter")}
              </h2>
              <p className="text-white/80 text-sm mt-1">{doctorName}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Star Rating */}
              <div className="text-center space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">
                  {t("patient.reviews.howWasExperience", "Bagaimana pengalaman Anda?")}
                </p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-125 focus:outline-none focus:scale-125"
                      disabled={isSubmitting}
                    >
                      <Star
                        className={`h-10 w-10 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? "text-amber-500 fill-amber-500 drop-shadow-sm"
                            : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {(hoveredRating || rating) > 0 && (
                  <p className="text-sm font-medium text-primary animate-fade-in">
                    {ratingLabels[hoveredRating || rating]}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  {t("patient.reviews.writeComment", "Tulis Komentar")}
                  <span className="text-muted-foreground font-normal">
                    ({t("patient.reviews.optional", "opsional")})
                  </span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t(
                    "patient.reviews.commentPlaceholder",
                    "Ceritakan pengalaman Anda dengan dokter ini..."
                  )}
                  className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none transition-colors"
                  maxLength={1000}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {comment.length}/1000
                </p>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="w-full h-12 rounded-xl text-base font-bold shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {t("patient.reviews.submitting", "Mengirim...")}
                  </>
                ) : (
                  t("patient.reviews.submitReview", "Kirim Review")
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
