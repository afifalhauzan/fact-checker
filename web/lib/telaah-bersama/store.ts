import { create } from "zustand";
import {
  CURRENT_USER,
  looksLikeUnbackedClaim,
  maskNik,
  posts as seedPosts,
  type ReportType,
  type TelaahPost,
} from "./mock-data";

// shortcut: in-memory prototype state, reset on page reload; replaced by the Laravel API (design doc 6.9).

export type NewTelaah = Omit<
  TelaahPost,
  "id" | "author" | "createdAt" | "reactionCount" | "matchCount" | "spamReports" | "asliResponses" | "comments" | "isSeed"
>;

/** What the owner may change after publishing (design doc 5.2): free text, and removals only. */
export type TelaahEdit = Pick<TelaahPost, "title" | "story" | "materialLines" | "attachments" | "links">;

// The prototype toggles between a signed-in user and a guest to try both experiences.
export type Viewer = "pengguna" | "tamu";

interface TelaahBersamaState {
  posts: TelaahPost[];
  reacted: Record<number, boolean>;
  reported: Record<number, ReportType>;
  viewer: Viewer;
  // Set when a guest tries an action that needs an account; shown by LoginPromptHost.
  loginPrompt: string | null;
  toggleReaction: (postId: number) => void;
  addComment: (postId: number, body: string) => void;
  report: (postId: number, type: ReportType, note?: string) => void;
  addPost: (draft: NewTelaah) => number;
  updatePost: (postId: number, edit: TelaahEdit) => void;
  removePost: (postId: number) => void;
  setViewer: (viewer: Viewer) => void;
  /** Returns true when the viewer may act; otherwise opens the login prompt with `reason`. */
  requireLogin: (reason: string) => boolean;
  closeLoginPrompt: () => void;
}

function updatePost(posts: TelaahPost[], postId: number, update: (post: TelaahPost) => TelaahPost): TelaahPost[] {
  return posts.map((post) => (post.id === postId ? update(post) : post));
}

export const useTelaahBersamaStore = create<TelaahBersamaState>((set, get) => ({
  posts: seedPosts,
  reacted: {},
  reported: {},
  viewer: "pengguna",
  loginPrompt: null,

  toggleReaction: (postId) => {
    const wasReacted = !!get().reacted[postId];
    set((state) => ({
      reacted: { ...state.reacted, [postId]: !wasReacted },
      posts: updatePost(state.posts, postId, (post) => ({
        ...post,
        reactionCount: post.reactionCount + (wasReacted ? -1 : 1),
      })),
    }));
  },

  addComment: (postId, body) => {
    set((state) => ({
      posts: updatePost(state.posts, postId, (post) => ({
        ...post,
        comments: [
          ...post.comments,
          {
            id: `c-${Date.now()}`,
            author: CURRENT_USER,
            isNewAccount: false,
            body: maskNik(body),
            flag: looksLikeUnbackedClaim(body) ? "klaim_tanpa_bukti" : undefined,
            createdAt: new Date().toISOString(),
          },
        ],
      })),
    }));
  },

  report: (postId, type, note) => {
    set((state) => ({
      reported: { ...state.reported, [postId]: type },
      posts: updatePost(state.posts, postId, (post) => {
        if (type === "spam") return { ...post, spamReports: post.spamReports + 1 };
        if (type === "lowongan_asli") {
          return {
            ...post,
            asliResponses: {
              count: post.asliResponses.count + 1,
              reasons: note ? [...post.asliResponses.reasons, note] : post.asliResponses.reasons,
            },
          };
        }
        // data_pribadi: the real flow re-scans the post first (design doc 5.3); nothing changes here.
        return post;
      }),
    }));
  },

  addPost: (draft) => {
    const id = Math.max(...get().posts.map((post) => post.id)) + 1;
    const now = new Date().toISOString();
    set((state) => ({
      posts: [
        {
          ...draft,
          id,
          author: CURRENT_USER,
          createdAt: now,
          reactionCount: 0,
          matchCount: 0,
          spamReports: 0,
          asliResponses: { count: 0, reasons: [] },
          comments: [],
          isSeed: false,
        },
        ...state.posts,
      ],
    }));
    return id;
  },

  updatePost: (postId, edit) => {
    set((state) => ({
      posts: updatePost(state.posts, postId, (post) => ({
        ...post,
        ...edit,
        story: edit.story ? maskNik(edit.story) : undefined,
      })),
    }));
  },

  removePost: (postId) => {
    set((state) => ({ posts: state.posts.filter((post) => post.id !== postId) }));
  },

  setViewer: (viewer) => set({ viewer }),

  requireLogin: (reason) => {
    if (get().viewer === "pengguna") return true;
    set({ loginPrompt: reason });
    return false;
  },

  closeLoginPrompt: () => set({ loginPrompt: null }),
}));
