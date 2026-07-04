import { MapPin, Phone, Star } from "lucide-react";

interface Props {
  businessName: string;
  category?: string | null;
  address?: string | null;
  phone?: string | null;
  accentColor?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
}

const PublicBookingHeader = ({ businessName, category, address, phone, accentColor, averageRating, reviewCount }: Props) => {
  const hasReviews = (reviewCount ?? 0) > 0 && (averageRating ?? 0) > 0;
  return (
    <header className="w-full max-w-2xl mx-auto text-center space-y-3">
      {accentColor && (
        <div
          className="h-1 w-16 mx-auto rounded-full mb-2"
          style={{ backgroundColor: accentColor }}
          aria-hidden
        />
      )}
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
        {businessName}
      </h1>
      {category && (
        <p className="text-sm uppercase tracking-widest text-muted-foreground">{category}</p>
      )}
      {hasReviews && (
        <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden />
          <span className="font-medium text-foreground">{Number(averageRating).toFixed(1)}</span>
          <span>· {reviewCount} {reviewCount === 1 ? "review" : "reviews"}</span>
        </div>
      )}
      {(address || phone) && (
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
          {address && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" aria-hidden />
              {address}
            </span>
          )}
          {phone && (
            <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Phone className="h-4 w-4" aria-hidden />
              {phone}
            </a>
          )}
        </div>
      )}
    </header>
  );
};

export default PublicBookingHeader;
