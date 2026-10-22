/** Whether the shared chat composer has content and is ready to submit. */
export function canSubmitChatMessage(input: string, attachmentCount: number, isLoading: boolean): boolean {
  return !isLoading && (input.trim().length > 0 || attachmentCount > 0);
}
