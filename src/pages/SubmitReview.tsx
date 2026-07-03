import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Star, AlertCircle, CheckCircle2 } from "lucide-react";
import SEO from "@/components/SEO";

const SubmitReview = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid link");
      setLoading(false);
      return;
    }
    // Validate token exists by trying to submit a HEAD-style check (we'll just try submit with 0 rating and catch error)
    // Simpler: just allow the form and handle errors on submit
    setLoading(false);
  }, [token]);

  const handleSubmit = async () => {
    if (!token || rating < 1) return;
    setSubmitting(true);
    try {
      const { data } = await supabase.functions.invoke("submit-review", {
        body: { token, rating, comment: comment.trim() || undefined },
      });
      if (data?.ok) {
        setSubmitted(true);
      } else {
        setError(data?.error || "Could not submit review");
      }
    } catch {
      setError("Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEO title="Leave a review — BookSuite" description="Share your experience" path={`/review/${token}`} />
      <div className="w-full max-w-md">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : submitted ? (
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Thank you!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your review has been submitted. We appreciate your feedback.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">How was your experience?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        n <= (hoverRating || rating)
                          ? "fill-warning text-warning"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Anything else you would like to share? (optional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  maxLength={2000}
                  rows={4}
                  className="bg-secondary border-border resize-none"
                />
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-glow)]"
                onClick={handleSubmit}
                disabled={rating < 1 || submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit review"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubmitReview;
