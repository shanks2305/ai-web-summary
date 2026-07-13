let configured = false;

/**
 * Apply TLS settings from environment before outbound HTTPS requests.
 *
 * Prefer NODE_EXTRA_CA_CERTS with your corporate CA bundle when possible.
 * TLS_INSECURE_SKIP_VERIFY=true disables verification (dev/corporate proxy only).
 */
export function configureTls(): void {
  if (configured) {
    return;
  }
  configured = true;

  if (process.env.TLS_INSECURE_SKIP_VERIFY === "true") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }
}
