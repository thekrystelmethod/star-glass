import type { Config } from "@netlify/functions";
import { purgeExpiredPortraitJobs } from "./_shared/portrait-store.ts";

export default async () => {
  try {
    await purgeExpiredPortraitJobs();
  } catch (reason) {
    console.error("Expired portrait cleanup failed", reason);
    throw reason;
  }
};

export const config: Config = {
  schedule: "@hourly",
};
