import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT ?? 3001),
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  SEAT_CLAIM_TTL_MIN: Number(process.env.SEAT_CLAIM_TTL_MIN ?? 10),
  PSP_WEBHOOK_SECRET: process.env.PSP_WEBHOOK_SECRET ?? "change_me",
};
