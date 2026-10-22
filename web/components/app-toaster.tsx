"use client";

import { Toaster } from "react-hot-toast";

/**
 * The one toaster for the whole app. It is mounted in the root layout, outside every page's
 * stacking context: inside a page section (e.g. the chat's z-10 column) its z-index only counts
 * within that section, which put toasts behind the z-50 navbar. It also means every page that
 * calls toast() shows it, not just the chat.
 */
export function AppToaster() {
  return <Toaster />;
}
