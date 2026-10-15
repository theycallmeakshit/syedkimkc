import cv2
import numpy as np
import base64

def generate_sample_pan_card() -> str:
    """Generates a realistic mock PAN card image and returns base64 PNG data URL."""
    w, h = 640, 400
    # Background: Light sky blue / cyan gradient common on PAN cards
    img = np.full((h, w, 3), 245, dtype=np.uint8)
    img[:, :, 0] = 230  # Blue tint
    img[:, :, 1] = 240
    img[:, :, 2] = 245

    # Top Header banner (Dark Navy)
    cv2.rectangle(img, (0, 0), (w, 60), (120, 45, 15), -1)
    cv2.putText(img, "INCOME TAX DEPARTMENT", (140, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
    cv2.putText(img, "GOVT. OF INDIA", (240, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 220, 255), 1)

    # Photo placeholder
    cv2.rectangle(img, (35, 90), (165, 250), (180, 180, 180), -1)
    cv2.rectangle(img, (35, 90), (165, 250), (100, 100, 100), 2)
    cv2.putText(img, "PHOTO", (65, 175), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (80, 80, 80), 2)

    # Text Fields
    cv2.putText(img, "Name / NAME", (190, 105), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (80, 80, 80), 1)
    cv2.putText(img, "RAJESH KUMAR SHARMA", (190, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 0), 2)

    cv2.putText(img, "Father's Name", (190, 165), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (80, 80, 80), 1)
    cv2.putText(img, "SURESH SHARMA", (190, 188), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 0), 2)

    cv2.putText(img, "Date of Birth", (190, 220), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (80, 80, 80), 1)
    cv2.putText(img, "14/08/1992", (190, 242), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)

    # Permanent Account Number (PAN) - Golden highlighted box
    cv2.rectangle(img, (190, 265), (580, 330), (220, 240, 255), -1)
    cv2.rectangle(img, (190, 265), (580, 330), (0, 140, 220), 2)
    cv2.putText(img, "Permanent Account Number", (205, 285), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (100, 50, 0), 1)
    cv2.putText(img, "ABCDE1234F", (205, 318), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 160), 2)

    # Contact line at bottom
    cv2.putText(img, "Registered Phone: +91 9876543210", (190, 365), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (60, 60, 60), 1)

    # Encode to base64 PNG
    _, buffer = cv2.imencode('.png', img)
    b64_str = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/png;base64,{b64_str}"

def generate_sample_salary_slip() -> str:
    """Generates a realistic mock salary slip document image."""
    w, h = 640, 480
    img = np.full((h, w, 3), 255, dtype=np.uint8)

    # Border
    cv2.rectangle(img, (15, 15), (w - 15, h - 15), (200, 200, 200), 2)

    # Header
    cv2.putText(img, "GLOBAL ENTERPRISE TECH CORP", (35, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (20, 40, 120), 2)
    cv2.putText(img, "CONFIDENTIAL SALARY PAYSLIP - OCT 2026", (35, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (120, 30, 30), 1)
    cv2.line(img, (35, 95), (w - 35, 95), (180, 180, 180), 1)

    # Details Grid
    cv2.putText(img, "Employee: Priya Patel (EMP-4091)", (35, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2)
    cv2.putText(img, "Department: Investment Banking", (35, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (50, 50, 50), 1)
    cv2.putText(img, "Official Email: priya.patel@globaltech.com", (35, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (50, 50, 50), 1)
    cv2.putText(img, "Tax ID / PAN: FGHIJ9876K", (35, 220), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 150), 2)

    cv2.line(img, (35, 240), (w - 35, 240), (220, 220, 220), 1)

    cv2.putText(img, "Bank Account: 50100492819201", (35, 275), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2)
    cv2.putText(img, "IFSC Code: HDFC0001234", (35, 305), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (50, 50, 50), 1)
    cv2.putText(img, "Basic Salary: Rs. 145,000", (35, 340), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 100, 0), 2)
    cv2.putText(img, "Net Disbursed: Rs. 182,400", (35, 375), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 120, 0), 2)

    # Footer note
    cv2.rectangle(img, (35, 410), (w - 35, 450), (240, 240, 245), -1)
    cv2.putText(img, "STRICTLY PRIVATE & CONFIDENTIAL - DO NOT CIRCULATE", (45, 435), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180, 0, 0), 1)

    _, buffer = cv2.imencode('.png', img)
    b64_str = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/png;base64,{b64_str}"

if __name__ == "__main__":
    p1 = generate_sample_pan_card()
    p2 = generate_sample_salary_slip()
    print("Sample generation verified! Lengths:", len(p1), len(p2))
