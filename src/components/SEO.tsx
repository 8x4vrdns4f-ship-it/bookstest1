import { Helmet } from "react-helmet-async";

const SITE_URL = "https://booksuite.online";

interface SEOProps {
  title: string;
  description: string;
  path: string; // e.g. "/pricing"
  noIndex?: boolean;
}

const SEO = ({ title, description, path, noIndex }: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
    </Helmet>
  );
};

export default SEO;
