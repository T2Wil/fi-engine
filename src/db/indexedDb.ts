/**
 * IndexedDB (Dexie) for persisting user inputs locally.
 */

import Dexie from "dexie";

export interface UserFinancialInput {
  id?: number;
  netWorthRwf: number;
  incomeRwf: number;
  expensesRwf: number;
  updatedAt: number;
}

const DB_NAME = "rwanda-fi-dashboard";

class AppDb extends Dexie {
  inputs!: Dexie.Table<UserFinancialInput, number>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      inputs: "++id, updatedAt",
    });
  }
}

export const db = new AppDb();

export async function saveInput(input: Omit<UserFinancialInput, "id" | "updatedAt">): Promise<number> {
  const row: UserFinancialInput = {
    ...input,
    updatedAt: Date.now(),
  };
  const id = await db.inputs.add(row);
  return id;
}

export async function getLatestInput(): Promise<UserFinancialInput | undefined> {
  const latest = await db.inputs.orderBy("updatedAt").reverse().first();
  return latest;
}

export async function updateLatestInput(
  input: Omit<UserFinancialInput, "id" | "updatedAt">
): Promise<void> {
  const existing = await getLatestInput();
  const row: UserFinancialInput = {
    ...input,
    updatedAt: Date.now(),
  };
  if (existing?.id != null) {
    await db.inputs.update(existing.id, row);
  } else {
    await db.inputs.add(row);
  }
}
