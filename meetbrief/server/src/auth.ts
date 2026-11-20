import type { NextFunction, Request, Response } from "express";
import type { Meeting } from "@meetbrief/shared";
import { auth, db } from "./firebase.js";

export interface AuthedRequest extends Request {
  uid: string;
  email?: string;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Verifies the Firebase ID token sent as `Authorization: Bearer <token>`. */
export async function requireUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw new HttpError(401, "Sign in required");
    const decoded = await auth.verifyIdToken(token);
    (req as AuthedRequest).uid = decoded.uid;
    (req as AuthedRequest).email = decoded.email;
    next();
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(401, "Invalid or expired session"));
  }
}

/** Loads a meeting and checks that the caller is a member. */
export async function loadMeetingForUser(meetingId: string, uid: string): Promise<Meeting> {
  const snap = await db.collection("meetings").doc(meetingId).get();
  if (!snap.exists) throw new HttpError(404, "Meeting not found");
  const meeting = { ...(snap.data() as Meeting), id: snap.id };
  if (!meeting.memberIds?.includes(uid)) throw new HttpError(404, "Meeting not found");
  return meeting;
}
