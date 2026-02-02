import axios from "axios";
import logger from "../logger.js";

class VTPassProvider {
  constructor() {
    this.name = "vtpass";
    this.baseUrl = process.env.VTPASS_SANDBOX_BASE_URL?.replace(/\/+$/, "");
    this.apiKey = process.env.VTPASS_SANDBOX_API_KEY;
    this.secretKey = process.env.VTPASS_SANDBOX_SECRET_KEY;

    // Validate environment variables immediately
    if (!this.baseUrl || !this.apiKey || !this.secretKey) {
      logger.error(
        "VTPASS configuration missing! Ensure BASE_URL, API_KEY, and SECRET_KEY are set in .env"
      );

      throw new Error(
        "VTPASS configuration missing! Ensure BASE_URL, API_KEY, and SECRET_KEY are set in .env"
      );
    }

    // Log config info safely (do not log secret keys in production!)
    logger.info(
      { env: process.env.NODE_ENV, mode: process.env.VTPASS_ENV || "sandbox" },
      "VTPASS initialized"
    );

    // Simple in-memory cache for service variations (optional)
    this.serviceCache = new Map();
  }

  async getServiceVariations(serviceID) {
    logger.warn("getServiceVariations called without serviceID");
    if (!serviceID) throw new Error("serviceID is required");

    // Return cached variations if available
    if (this.serviceCache.has(serviceID)) {
      logger.debug({ serviceID }, "Returning cached service variations");
      return this.serviceCache.get(serviceID);
    }

    try {
      const url = `${this.baseUrl}/service-variations?serviceID=${serviceID}`;
      logger.info({ url, serviceID }, "Fetching variations from VTPass");

      const response = await axios.get(url, {
        headers: {
          "api-key": this.apiKey,
          "secret-key": this.secretKey,
          "Content-Type": "application/json",
        },
        timeout: 15000, // 15 seconds timeout
      });

      if (response.data?.response_code !== "000") {
        logger.error(
          { responseData: response.data, serviceID },
          "VTPass returned an error for service variations"
        );

        throw new Error(
          `VTPass error: ${
            response.data?.response_description || "Unknown error"
          }`
        );
      }

      const variations = response.data?.content || [];
      // Cache variations for 10 minutes
      this.serviceCache.set(serviceID, variations);
      setTimeout(() => this.serviceCache.delete(serviceID), 10 * 60 * 1000);

      logger.debug(
        { serviceID, variationCount: variations.length },
        "Service variations fetched successfully"
      );

      return variations;
    } catch (err) {
      logger.error(
        { err, serviceID },
        "Error fetching VTPass service variations"
      );
      throw err;
    }
  }

  async purchaseService(payload) {
    const requiredFields = [
      "serviceID",
      "billersCode",
      "variation_code",
      "amount",
    ];
    for (let field of requiredFields) {
      if (!payload[field]) {
        logger.warn(
          { payload },
          `purchaseService missing required field: ${field}`
        );
        throw new Error(
          `purchaseService payload missing required field: ${field}`
        );
      }
    }

    try {
      const url = `${this.baseUrl}/pay`;
      logger.info(
        { url, payload: { ...payload, billersCode: payload.billersCode } },
        "Purchasing service at VTPass"
      );

      const response = await axios.post(url, payload, {
        headers: {
          "api-key": this.apiKey,
          "secret-key": this.secretKey,
          "Content-Type": "application/json",
        },
        timeout: 20000, // 20 seconds timeout
      });

      if (response.data?.response_code !== "000") {
        logger.error(
          { responseData: response.data, payload },
          "VTPass purchase failed"
        );

        throw new Error(
          `VTPass purchase failed: ${
            response.data?.response_description || "Unknown error"
          }`
        );
      }

      logger.info(
        { transactionId: response.data?.content?.transactionId, payload },
        "VTPass purchase successful"
      );

      return response.data;
    } catch (err) {
      logger.error({ err, payload }, "Error purchasing service at VTPass");
      throw err;
    }
  }
}

export default new VTPassProvider();
