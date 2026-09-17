export type GuestStatus = "pending" | "confirmed" | "declined";

const CONFIRMED = "bg-[#E4F0E2] text-[#3D5C3A]";
const PENDING = "bg-[#F7EFD0] text-[#7A5C14]";
const DECLINED = "bg-[#F6E0E0] text-[#7A3B3B]";

export function guestStatusTag(status: GuestStatus): {
  label: string;
  className: string;
} {
  if (status === "confirmed") {
    return { label: "Confirmou", className: CONFIRMED };
  }
  if (status === "declined") {
    return { label: "Não vai", className: DECLINED };
  }
  return { label: "Pendente", className: PENDING };
}

export function unmatchedAttendanceTag(attending: boolean): {
  label: string;
  className: string;
} {
  return attending
    ? { label: "Vou", className: CONFIRMED }
    : { label: "Não vai", className: DECLINED };
}
