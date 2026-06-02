import { useNavigate, useParams } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const BookingCancelled = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
        <XCircle className="mx-auto text-muted-foreground mb-4" size={48} />
        <h1 className="text-xl font-bold text-foreground mb-2">Payment cancelled</h1>
        <p className="text-sm text-muted-foreground mb-6">
          No charge was made. Your slot wasn't booked.
        </p>
        <Button onClick={() => navigate(`/book/${userId}`)} className="bg-accent text-accent-foreground hover:bg-accent/90">
          Try again
        </Button>
      </div>
    </div>
  );
};

export default BookingCancelled;
