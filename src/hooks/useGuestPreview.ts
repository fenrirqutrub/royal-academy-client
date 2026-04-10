import { TOKEN_KEY } from "./axiosPublic";

const PREVIEW_LIMIT = 3;

export const useGuestPreview = () => {
  const hasToken = !!localStorage.getItem(TOKEN_KEY);
  return { isGuest: !hasToken, previewLimit: PREVIEW_LIMIT };
};
