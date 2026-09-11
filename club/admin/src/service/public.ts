import axios from "axios";

const base_url = import.meta.env.VITE_BACKEND_URL || "/api";

/**
 * The unauthenticated read API.
 *
 * The marketing pages used to call `/admin/...` endpoints, which is why those
 * endpoints had no authentication: protecting them would have broken the home
 * page. They are protected now, and everything a visitor sees comes from
 * `/public/...` instead.
 *
 * A bare axios instance is used on purpose. The shared one attaches a bearer
 * token and, on a 401, tries to refresh and then redirects to the sign-in
 * page. On a public page there is nobody to sign in, so that behaviour would
 * bounce ordinary visitors to a login screen.
 */
const publicApi = axios.create({ baseURL: base_url, timeout: 15000 });

export const getPublicEvents = (limit = 24) => publicApi.get(`/public/events?limit=${limit}`);
export const getPublicEvent = (id: string) => publicApi.get(`/public/events/${id}`);

export const getPublicAnnouncements = (limit = 20) => publicApi.get(`/public/announcements?limit=${limit}`);
export const getPublicAnnouncement = (id: string) => publicApi.get(`/public/announcements/${id}`);

export const getPublicGallery = (limit = 30) => publicApi.get(`/public/gallery?limit=${limit}`);

export const getPublicNews = (limit = 20) => publicApi.get(`/public/news?limit=${limit}`);
export const getPublicNewsItem = (id: string) => publicApi.get(`/public/news/${id}`);

export const getPublicReviews = (limit = 12) => publicApi.get(`/public/reviews?limit=${limit}`);

export const getPublicStats = () => publicApi.get(`/public/stats`);

export default publicApi;
