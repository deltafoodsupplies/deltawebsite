import { validateInquiry } from "../src/validate.js";

const t1 = validateInquiry({ businessName: "Spice Mart", email: "a@b.co", type: "contact" });
console.assert(t1.ok && !t1.isBot && t1.data.businessName === "Spice Mart", "t1 failed", JSON.stringify(t1));

const t2 = validateInquiry({ email: "bad" });
console.assert(!t2.ok && t2.errors.length === 2, "t2 failed");

const t3 = validateInquiry({ businessName: "X", email: "a@b.co", _honey: "spam" });
console.assert(t3.ok && t3.isBot, "t3 failed");

const t4 = validateInquiry({ businessName: "Y".repeat(500), email: "a@b.co" });
console.assert(t4.data.businessName.length === 200, "t4 failed");

const t5 = validateInquiry({ businessName: "Z", email: "a@b.co", type: "account-application" });
console.assert(!t5.ok, "t5 failed");

const t6 = validateInquiry({ businessName: "Tab\tName X", email: "a@b.co" });
console.assert(t6.data.businessName === "Tab Name X", "t6 failed: " + t6.data.businessName);

const t7 = validateInquiry(null);
console.assert(!t7.ok, "t7 failed");

console.log("validate.js: all 7 tests passed");
