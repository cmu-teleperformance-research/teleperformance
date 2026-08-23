const RETURN_PARAM = "return";

function isQualtricsUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return host === "qualtrics.com" || host.endsWith(".qualtrics.com");
  } catch {
    return false;
  }
}

export function getQualtricsReturnUrl() {
  const raw = new URLSearchParams(window.location.search).get(RETURN_PARAM);
  if (!raw) return null;
  return isQualtricsUrl(raw) ? raw : null;
}

export function buildQualtricsReturnUrl(returnUrl, params) {
  const url = new URL(returnUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") url.searchParams.set(key, String(value));
  });
  return url.toString();
}
