/**
 * Fetch page/product data from URL for Auto mode.
 * In production this would call a backend API that scrapes or parses the URL
 * and returns structured data (title, description, images, price, etc.).
 * Here we simulate with a timeout and optional CORS-friendly fetch of the URL
 * to at least get the page title, or return a placeholder for backend integration.
 */

export interface FetchedPageData {
  title?: string;
  description?: string;
  image?: string;
  price?: string;
  [key: string]: string | undefined;
}

export async function fetchDataFromUrl(url: string): Promise<FetchedPageData> {
  if (!url || !url.startsWith("http")) {
    throw new Error("Please enter a valid URL starting with http:// or https://");
  }

  // Try to fetch the URL (will often fail due to CORS on external sites).
  // In production, call your backend: e.g. POST /api/ai-page-builder/fetch-url { url }
  try {
    const res = await fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      headers: { Accept: "text/html" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // Minimal client-side extraction (no DOM parser needed for simple regex)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;
    const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const description = metaDesc ? metaDesc[1].trim() : undefined;
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const image = ogImage ? ogImage[1].trim() : undefined;

    return {
      title: title || "Fetched page",
      description: description || "",
      image: image || "",
    };
  } catch (e) {
    // CORS or network error: return a placeholder and suggest backend
    const message = e instanceof Error ? e.message : "Network or CORS error";
    return {
      title: "Sample title (use backend API for real fetch)",
      description: "Fetching from URL failed: " + message + ". Use Manual mode or connect a backend API that fetches the URL server-side.",
      image: "",
    };
  }
}

/**
 * Map fetched page data to form values for a given template.
 * Override with your template-specific mapping; this is a generic mapping.
 */
export function mapFetchedDataToFormValues(
  data: FetchedPageData,
  _templateId: string
): Record<string, string> {
  const v: Record<string, string> = {};
  if (data.title) {
    v.hero_heading = data.title;
    v.cta_heading = "Get " + data.title;
  }
  if (data.description) {
    v.hero_text = data.description;
    v.problem_text = data.description;
    v.solution_text = data.description;
  }
  if (data.image) {
    v.hero_image = data.image;
    v.product_image_1 = data.image;
    v.ugc_image_1 = data.image;
  }
  if (data.price) {
    v.bundle_1_price = data.price;
    v.discount_label = data.price;
  }
  return v;
}
