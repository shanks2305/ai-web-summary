export type UrlValidationResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

/** Normalize protocol and validate that the value is a usable HTTP(S) URL. */
export function validateUrl(raw: unknown): UrlValidationResult {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, message: "url is required" };
  }

  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, message: "url must use http or https" };
    }
  } catch {
    return { ok: false, message: "invalid url" };
  }

  return { ok: true, url };
}
