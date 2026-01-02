// // utils/validatePhoneNumber.js
// import { parsePhoneNumberFromString } from "libphonenumber-js";

// /**
//  * Validates a Nigerian phone number using libphonenumber-js.
//  * @param {string} phone - The phone number in local (e.g., 08012345678) or international format (e.g., +2348012345678).
//  * @returns {object} - { isValid: boolean, formatted: string | null, error: string | null }
//  */
// const validateNigerianPhone = (phone) => {
//   // Try to auto-parse with Nigeria as default country
//   const phoneNumber = parsePhoneNumberFromString(phone, "NG");

//   if (!phoneNumber) {
//     return {
//       isValid: false,
//       formatted: null,
//       error: "Invalid phone number format",
//     };
//   }

//   if (!phoneNumber.isValid()) {
//     return {
//       isValid: false,
//       formatted: null,
//       error: "Invalid Nigerian phone number",
//     };
//   }

//   return {
//     isValid: true,
//     formatted: phoneNumber.number, // e.g., +2348012345678
//     error: null,
//   };
// };

// export default validateNigerianPhone;
