const isProduction = process.env.NODE_ENV === "production";

export const VT_PASS_BASE_URL = isProduction
  ? process.env.VTPASS_BASE_URL
  : process.env.VTPASS_SANDBOX_BASE_URL;

export const VT_PASS_API_KEY = isProduction
  ? process.env.VTPASS_API_KEY
  : process.env.VTPASS_SANDBOX_API_KEY;

export const VT_PASS_SECRET_KEY = isProduction
  ? process.env.VTPASS_SECRET_KEY
  : process.env.VTPASS_SANDBOX_SECRET_KEY;

export const PAYSTACK_SECRET_KEY = isProduction
  ? process.env.PAYSTACK_SECRET_KEY
  : process.env.PAYSTACK_SECRET_TEST_KEY;
