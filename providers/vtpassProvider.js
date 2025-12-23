// import dotenv from "dotenv";
// dotenv.config();

import axios from "axios";

class VTPassProvider {
  constructor() {
    this.name = "vtpass";
    this.baseUrl = process.env.VTPASS_SANDBOX_BASE_URL?.replace(/\/+$/, "");
    this.apiKey = process.env.VTPASS_SANDBOX_API_KEY;
    this.secretKey = process.env.VTPASS_SANDBOX_SECRET_KEY;
    console.log("🔑 VTPASS BASE URL:", this.baseUrl);
    console.log("🔑 API KEY:", this.apiKey ? "Loaded ✅" : "Missing ❌");
    console.log("🔑 SECRET KEY:", this.secretKey ? "Loaded ✅" : "Missing ❌");
  }

  async getServiceVariations(serviceID) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/service-variations?serviceID=${serviceID}`,
        {
          headers: {
            "api-key": this.apiKey,
            "secret-key": this.secretKey,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(
        `🔗 Calling: ${this.baseUrl}/service-variations?serviceID=${serviceID}`
      );

      return response.data?.content || {};
    } catch (err) {
      console.error(`❌ Error fetching variations from VTPass:`, err.message);
      throw err;
    }
  }

  async purchaseService(payload) {
    try {
      const response = await axios.post(`${this.baseUrl}/pay`, payload, {
        headers: {
          "api-key": this.apiKey,
          "secret-key": this.secretKey,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (err) {
      console.error(`❌ Error purchasing service from VTPass:`, err.message);
      throw err;
    }
  }
}

export default new VTPassProvider();
