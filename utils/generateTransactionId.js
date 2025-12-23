import crypto from "crypto";

const generateTransactionId = () => {
  return `TX-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`;
};

export default generateTransactionId;
