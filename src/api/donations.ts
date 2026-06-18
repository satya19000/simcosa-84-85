import { createServerFn } from "@tanstack/react-start";
import { requireApproved } from "../backend/auth/middleware";
import { query } from "../backend/db";

export interface DonationRow {
  id: string;
  donor_name: string;
  amount: string;
  purpose: string | null;
  donated_on: string;
  created_at: string;
}

export interface ExpenseRow {
  id: string;
  description: string;
  amount: string;
  spent_on: string;
  category: string | null;
  created_at: string;
}

export const listDonations = createServerFn({ method: "GET" })
  .middleware([requireApproved])
  .handler(async (): Promise<DonationRow[]> => {
    const res = await query<DonationRow>(
      `SELECT * FROM donations ORDER BY donated_on DESC`,
    );
    return res.rows;
  });

export const listExpenses = createServerFn({ method: "GET" })
  .middleware([requireApproved])
  .handler(async (): Promise<ExpenseRow[]> => {
    const res = await query<ExpenseRow>(
      `SELECT * FROM expenses ORDER BY spent_on DESC`,
    );
    return res.rows;
  });
