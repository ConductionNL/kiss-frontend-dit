type FetchArgs = Parameters<typeof fetch>;
type FetchReturn = ReturnType<typeof fetch>;

// eslint-disable-next-line @typescript-eslint/no-empty-function
const empty = () => {};

const waitForLogin = {
  promise: Promise.resolve(),
  resolve: empty,
};

(function refreshPromise() {
  const promise = new Promise<void>((resolve) => {
    waitForLogin.resolve = resolve;
  });
  waitForLogin.promise = promise;
  // will keep refreshing the promise whenever it resolves,
  // which is done when succesfully logged in.
  // this causes all pending 401 requests to retry,
  // but new 401 requests to wait for the new promise.
  promise.finally(refreshPromise);
})();

export function handleLogin() {
  waitForLogin.resolve();
}

export function fetchLoggedIn(...args: FetchArgs): FetchReturn {
  const init = args[1] || {};

  if (!init.credentials) {
    init.credentials = "include";
    args[1] = init;
  }

  return fetch(...args).then((r) => {
    if (r.status === 401) {
      console.warn("session expired. waiting for user to log in...");
      return waitForLogin.promise.then(() => {
        return fetchLoggedIn(...args);
      });
    }
    return r;
  });
}
