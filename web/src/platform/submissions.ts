/**
 * Sự kiện gửi lên (Firestore "submissions"). Rules: ai đã đăng nhập đều gửi được (đúng khuôn, đúng uid của mình);
 * chỉ quản trị viên đọc, đổi trạng thái hoặc xóa.
 */
import { loadAccount, session } from "./account";
import { track } from "./stats";
import { cleanInput, Submission, SubmissionInput } from "../utils/submissions";

export async function sendSubmission(input: SubmissionInput): Promise<"ok" | "signin" | "error"> {
  await loadAccount();
  const s = session();
  if (!s) return "signin";
  try {
    const { addDoc, collection, serverTimestamp } = await import("firebase/firestore/lite");
    await addDoc(collection(s.db, "submissions"), { ...cleanInput(input), uid: s.uid, by: s.name, status: "new", createdAt: serverTimestamp() });
    track("submit_event");
    return "ok";
  } catch (e) {
    return "error";
  }
}

export async function adminListSubmissions(): Promise<Submission[]> {
  const s = session();
  if (!s) return [];
  const { collection, getDocs } = await import("firebase/firestore/lite");
  const snap = await getDocs(collection(s.db, "submissions"));
  const out: Submission[] = [];
  snap.forEach((d) => {
    const o = d.data() as Record<string, unknown>;
    const at = o.createdAt as { toMillis?: () => number } | undefined;
    out.push({
      id: d.id,
      title: String(o.title || ""),
      start_date: String(o.start_date || ""),
      end_date: String(o.end_date || ""),
      venue: String(o.venue || ""),
      desc: String(o.desc || ""),
      link: String(o.link || ""),
      contact: String(o.contact || ""),
      repeat: o.repeat === "daily" || o.repeat === "weekly" ? o.repeat : "once",
      weekdays: Array.isArray(o.weekdays) ? (o.weekdays as unknown[]).filter((d): d is number => typeof d === "number") : [],
      time: typeof o.time === "string" ? o.time : "",
      by: String(o.by || ""),
      status: o.status === "approved" || o.status === "rejected" ? o.status : "new",
      createdAt: at && at.toMillis ? at.toMillis() : 0,
    });
  });
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

export async function adminSetSubmission(id: string, status: "approved" | "rejected"): Promise<void> {
  const s = session();
  if (!s) throw new Error("Chưa đăng nhập");
  const { doc, updateDoc } = await import("firebase/firestore/lite");
  await updateDoc(doc(s.db, "submissions", id), { status });
}
