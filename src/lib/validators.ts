/**
 * Format Validators and Derived Facts Generator
 * Checks format standards for Indian Mobile numbers, PAN, and Email addresses.
 * Raw values never leave this module. Only boolean facts and safe counts are returned.
 */

export interface PhoneFacts {
  digitCount: number;
  hasCountryCode: boolean;
  formatValid: boolean;
}

export interface PanFacts {
  length: number;
  formatValid: boolean;
}

export interface EmailFacts {
  formatValid: boolean;
}

export type EntityFacts = PhoneFacts | PanFacts | EmailFacts;

/**
 * Validates Indian mobile number format.
 * Strips spaces, hyphens and parentheses.
 * Accepts optional prefix +91, 91 or 0 only when the remaining part is exactly 10 digits.
 * Checks format only: formatValid is true when remaining 10 digits match /^[6-9]\d{9}$/.
 */
export function validateIndianMobile(raw: string): PhoneFacts {
  if (!raw || typeof raw !== "string") {
    return { digitCount: 0, hasCountryCode: false, formatValid: false };
  }

  const cleaned = raw.replace(/[\s\-\(\)]/g, "");
  let remaining = cleaned;
  let hasCountryCode = false;

  if (cleaned.startsWith("+91") && cleaned.slice(3).length === 10) {
    hasCountryCode = true;
    remaining = cleaned.slice(3);
  } else if (cleaned.startsWith("91") && cleaned.slice(2).length === 10) {
    hasCountryCode = true;
    remaining = cleaned.slice(2);
  } else if (cleaned.startsWith("0") && cleaned.slice(1).length === 10) {
    hasCountryCode = false;
    remaining = cleaned.slice(1);
  }

  const digitsOnly = remaining.replace(/\D/g, "");
  const digitCount = digitsOnly.length;
  const formatValid = /^[6-9]\d{9}$/.test(remaining);

  return {
    digitCount,
    hasCountryCode,
    formatValid,
  };
}

/**
 * Validates PAN format.
 * Uppercases the input.
 * Checks format only: formatValid is true when input matches /^[A-Z]{5}[0-9]{4}[A-Z]$/.
 * Never returns substrings, characters, or holder type.
 */
export function validatePan(raw: string): PanFacts {
  if (!raw || typeof raw !== "string") {
    return { length: 0, formatValid: false };
  }

  const trimmed = raw.trim().toUpperCase();
  const formatValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(trimmed);

  return {
    length: trimmed.length,
    formatValid,
  };
}

/**
 * Validates Email syntax format using a conservative check.
 * Checks format only: does not return local part or domain.
 */
export function validateEmail(raw: string): EmailFacts {
  if (!raw || typeof raw !== "string") {
    return { formatValid: false };
  }

  const trimmed = raw.trim();
  const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
  const formatValid = emailRegex.test(trimmed);

  return {
    formatValid,
  };
}

export interface DerivedFactItem {
  token: string;
  type: "PHONE" | "PAN" | "EMAIL";
  summary: string;
  formatValid: boolean;
  facts: EntityFacts;
}

/**
 * Generates neutral derived facts statements for format checks only.
 * Never uses words like "valid number", "registered" or "active".
 */
export function generateFactSummary(
  token: string,
  type: "PHONE" | "PAN" | "EMAIL",
  raw: string
): DerivedFactItem {
  if (type === "PHONE") {
    const facts = validateIndianMobile(raw);
    const summary = facts.formatValid
      ? `${token}: Indian mobile format check passed (10 digits, starts with 6 to 9).`
      : `${token}: Indian mobile format check failed (${facts.digitCount} digits${
          facts.digitCount === 10 ? ", does not start with 6 to 9" : ""
        }).`;
    return {
      token,
      type,
      summary,
      formatValid: facts.formatValid,
      facts,
    };
  }

  if (type === "PAN") {
    const facts = validatePan(raw);
    const summary = facts.formatValid
      ? `${token}: PAN format check passed.`
      : `${token}: PAN format check failed.`;
    return {
      token,
      type,
      summary,
      formatValid: facts.formatValid,
      facts,
    };
  }

  const facts = validateEmail(raw);
  const summary = facts.formatValid
    ? `${token}: Email format check passed.`
    : `${token}: Email format check failed.`;
  return {
    token,
    type,
    summary,
    formatValid: facts.formatValid,
    facts,
  };
}

/**
 * Escapes or strips user text that attempts to imitate internal facts block syntax.
 */
export function sanitizeUserImitations(text: string): string {
  if (!text || typeof text !== "string") return "";
  // Strip fake format facts lines injected by user
  return text.replace(/\[(?:PHONE|PAN|EMAIL)_[0-9]+\]\s*:\s*[^\n\r]+/gi, "[FILTERED_INJECTION]");
}

/**
 * Direct rule-based answer when the prompt is purely a format question about one entity.
 */
export function getGatewayFormatDirectAnswer(factItem: DerivedFactItem): string {
  if (factItem.type === "PHONE") {
    const phoneFacts = factItem.facts as PhoneFacts;
    if (phoneFacts.formatValid) {
      return "Format check: the number has 10 digits and starts with 6 to 9, which matches the Indian mobile number format. This does not confirm that the number is active or assigned.";
    }
    return `Format check: the number does not match the Indian mobile number format (${phoneFacts.digitCount} digits detected). This check applies to format only and does not confirm whether a number is active or assigned.`;
  }

  if (factItem.type === "PAN") {
    const panFacts = factItem.facts as PanFacts;
    if (panFacts.formatValid) {
      return "Format check: the PAN format matches the standard 10 character structure (5 letters, 4 digits, 1 letter). This does not confirm that the PAN is registered or active.";
    }
    return `Format check: the input does not match the standard PAN format (${panFacts.length} characters detected). This check applies to format only.`;
  }

  const emailFacts = factItem.facts as EmailFacts;
  if (emailFacts.formatValid) {
    return "Format check: the input matches standard email syntax format. This does not confirm that the address is active or deliverable.";
  }
  return "Format check: the input does not match standard email syntax format. This check applies to format only.";
}

/**
 * Builds the derived facts block to append to the system instructions.
 */
export function buildDerivedFactsBlock(items: DerivedFactItem[]): string {
  if (!items || items.length === 0) return "";
  return items.map((i) => i.summary).join("\n");
}

/**
 * Checks whether user text is purely asking about the format of an identifier.
 */
export function isDirectFormatQuestion(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const formatKeywords = [
    "valid",
    "eligible",
    "correct format",
    "is this a valid",
    "check format",
    "format check",
    "meets standard",
    "meets standards",
  ];
  return formatKeywords.some((kw) => lower.includes(kw));
}
