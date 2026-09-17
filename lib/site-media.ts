import { isUuid } from "@/lib/content/validation";

export function publicMediaUrl(id: string): string {
  return `/api/site-media/${id}`;
}

export function parseMediaId(value: string | undefined): string | null {
  if (!value) return null;
  return isUuid(value) ? value : null;
}
