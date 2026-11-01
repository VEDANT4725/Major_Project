export const WORKER_URL = import.meta.env.VITE_WORKER_URL || "http://localhost:8080";
async function authenticatedFetch(getToken, path, options = {}) {
  const token = await getToken();
  if (!token) {
    throw new Error("Not Authenticated - no session token available");
  }
  const response = await fetch(`${WORKER_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      error: "Unknown error",
      code: "UNKNOWN_ERROR"
    }));
    if (response.status === 429) {
      const retryAfter = errorBody.retryAfter ?? 60;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("rate-limited", {
          detail: {
            retryAfter
          }
        }));
      }
    }
    throw new Error(errorBody.error || `Request failed with satus ${response.status}`);
  }
  return response.json();
}
export function createApiClient(getToken) {
  return {
    projects: {
      list: () => authenticatedFetch(getToken, "/api/projects"),
      get: id => authenticatedFetch(getToken, `/api/projects/${id}`),
      getFiles: id => authenticatedFetch(getToken, `/api/projects/${id}/files`),
      create: data => authenticatedFetch(getToken, "/api/projects", {
        method: "POST",
        body: JSON.stringify(data)
      }),
      update: (id, data) => authenticatedFetch(getToken, `/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      }),
      delete: id => authenticatedFetch(getToken, `/api/projects/${id}`, {
        method: "DELETE"
      })
    },
    chats: {
      getHistory: projectId => authenticatedFetch(getToken, `/api/chat/${projectId}`)
    },
    credits: {
      get: () => authenticatedFetch(getToken, `/api/credits`)
    },
    versions: {
      list: projectId => authenticatedFetch(getToken, `/api/projects/${projectId}/versions`),
      getFiles: (projectId, version) => authenticatedFetch(getToken, `/api/projects/${projectId}/versions/${version}`),
      create: (projectId, data) => authenticatedFetch(getToken, `/api/projects/${projectId}/versions`, {
        method: "POST",
        body: JSON.stringify(data)
      })
    },
    settings: {
      getGithub: () => authenticatedFetch(getToken, "/api/settings/github"),
      connectGithub: token => authenticatedFetch(getToken, "/api/settings/github", {
        method: "POST",
        body: JSON.stringify({
          token
        })
      }),
      connectGithubOauth: code => authenticatedFetch(getToken, "/api/settings/github/oauth", {
        method: "POST",
        body: JSON.stringify({
          code
        })
      }),
      disconnectGithub: () => authenticatedFetch(getToken, "/api/settings/github", {
        method: "DELETE"
      }),
      getGithubToken: () => authenticatedFetch(getToken, "/api/settings/github/token")
    },
    analytics: {
      get: () => authenticatedFetch(getToken, "/api/analytics")
    }
  };
}
