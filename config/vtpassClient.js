import axios from "axios";

export const vtpassClient = async ({
  serviceID,
  phone,
  amount,
  variation_code,
}) => {
  const baseUrl = process.env.VTPASS_SANDBOX_BASE_URL.replace(/\/+$/, "");
  const request_id = Date.now().toString();

  console.log("🔁 Sending to VTPass:", {
    request_id,
    serviceID,
    phone,
    amount,
    variation_code,
  });

  try {
    const response = await axios.post(
      `${baseUrl}/pay`,
      {
        request_id,
        serviceID,
        phone,
        ...(amount && { amount }), // use amount if airtime
        ...(variation_code && { variation_code }), // use variation if data
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.VTPASS_SANDBOX_API_KEY,
          "secret-key": process.env.VTPASS_SANDBOX_SECRET_KEY,
        },
      }
    );

    console.log("✅ VTPass response:", response.data);
    return response.data;
  } catch (error) {
    console.error("VTPass API error:", error.response?.data || error.message);
    throw error;
  }
};

// Write my code here