const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function _fetch(endpoint, options = {}) {
    const token = localStorage.getItem("flux_token");
    const headers = {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Something went wrong");
    }

    return response.json();
}

export const api = {
    login: async (username, password) => {
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        return fetch(`${API_BASE_URL}/token`, {
            method: "POST",
            body: formData,
        }).then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Invalid credentials");
            return data;
        });
    },

    register: async (username, password) => {
        return _fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
    },

    getChats: () => _fetch("/chats"),

    createChat: (title) => _fetch("/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
    }),

    getChat: (chatId) => _fetch(`/chats/${chatId}`),

    deleteChat: (chatId) => _fetch(`/chats/${chatId}`, {
        method: "DELETE",
    }),

    sendMessage: (chatId, content) => _fetch(`/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    }),

    getGallery: () => _fetch("/gallery"),
};

export const getImageUrl = (path) => `${API_BASE_URL}${path}`;
