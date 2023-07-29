const DEFAULT_REDIRECT = '/';

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT,
) {
  if (!to || typeof to !== 'string') {
    return defaultRedirect;
  }

  if (!to.startsWith('/') || to.startsWith('//')) {
    return defaultRedirect;
  }

  return to;
}

// TODO: remove once requestIdleCallback is available in Safari
// https://caniuse.com/requestidlecallback
export function requestIdleCallbackShim(cb: () => void) {
  if (typeof requestIdleCallback === 'function') {
    return requestIdleCallback(cb);
  }
  return setTimeout(cb, 1);
}
