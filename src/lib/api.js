const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const getAuthToken = () => localStorage.getItem("auth_token");

const buildHeaders = (headers, auth) => {
  const next = { ...(headers || {}) };
  if (!next["Content-Type"]) {
    next["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getAuthToken();
    if (token) {
      next.Authorization = `Bearer ${token}`;
    }
  }
  return next;
};

const parseJson = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return null;
};

export const apiFetch = async (path, options = {}) => {
  const {
    method = "GET",
    body,
    headers,
    auth = true,
  } = options;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: buildHeaders(headers, auth),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorBody = await parseJson(res);
    const message = errorBody?.detail || errorBody?.message || res.statusText;
    throw new Error(message);
  }

  return parseJson(res);
};

export const authApi = {
  login: (payload) => apiFetch("/auth/login", { method: "POST", body: payload, auth: false }),
  signup: (payload) => apiFetch("/auth/signup", { method: "POST", body: payload, auth: false }),
  googleLogin: (idToken) =>
    apiFetch("/auth/login/google", {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
      auth: false,
    }),
  me: () => apiFetch("/auth/me"),
};

export const tagsApi = {
  listSummary: () => apiFetch("/tags/summary"),
  listPeople: () => apiFetch("/tags/people"),
  rename: (oldName, newName) =>
    apiFetch("/tags/rename", { method: "POST", body: { old_name: oldName, new_name: newName } }),
};

export const photosApi = {
  listAll: () => apiFetch("/albums/photos"),
  listByTags: (tags) => {
    const params = new URLSearchParams();
    if (tags?.length) {
      params.set("tags", tags.join(","));
    }
    const suffix = params.toString();
    return apiFetch(`/albums/photos${suffix ? `?${suffix}` : ""}`);
  },
  batch: (photoIds) =>
    apiFetch("/photos/batch", { method: "POST", body: { photo_ids: photoIds } }),
  getDetections: (photoId) => apiFetch(`/photos/${photoId}/detections`),
  importDrive: (accessToken, folderId, includeSubfolders = true) =>
    apiFetch("/photos/import/google-drive", {
      method: "POST",
      body: {
        access_token: accessToken,
        folder_id: folderId || null,
        include_subfolders: includeSubfolders,
      },
    }),
};

export const aiApi = {
  status: () => apiFetch("/ai/status"),
  categorize: (payload = {}) => apiFetch("/ai/categorize", { method: "POST", body: payload }),
  select: (prompt, limit = 5) =>
    apiFetch("/ai/select", { method: "POST", body: { prompt, limit } }),
  mockSync: (payload = {}) => apiFetch("/ai/mock/sync", { method: "POST", body: payload }),
  mockAlbums: (payload = {}) => apiFetch("/ai/mock/albums", { method: "POST", body: payload }),
};

export const promptsApi = {
  create: (text) => apiFetch("/prompts", { method: "POST", body: { text } }),
  getResult: (promptId) => apiFetch(`/prompts/${promptId}/result`),
};

export const boardApi = {
  get: () => apiFetch("/board"),
  update: (payload) => apiFetch("/board", { method: "PUT", body: payload }),
};

export const driveApi = {
  listFolders: (accessToken, parentId, includeSubfolders = true) =>
    apiFetch("/drive/folders", {
      method: "POST",
      body: {
        access_token: accessToken,
        parent_id: parentId || null,
        include_subfolders: includeSubfolders,
      },
    }),
};
