/**
 * Terms and Privacy prose (NDPA context).
 * Working drafts for legal review — real policy text, not placeholders.
 */

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export const DRAFT_NOTICE = 'Draft for legal review. This wording is a working draft prepared for the product team and has not been reviewed by counsel.';
export const LEGAL_UPDATED = 'Last updated: 7 October 2026';

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: '1. About these terms',
    paragraphs: [
      'TrustLink Logistics ("TrustLink", "we") provides last-mile pickup and delivery of parcels and documents within selected areas of Abuja, Nigeria. These terms govern your use of the TrustLink customer app.',
      'By creating an account you confirm that the phone number you register belongs to you and that you are able to enter into a binding agreement.',
    ],
  },
  {
    heading: '2. Your account',
    paragraphs: [
      'You are responsible for the accuracy of the details on your account, including your name, contact details and the pickup and drop-off information you submit with each request.',
      'Your phone number is your account identifier and cannot be changed in the app. Contact support if your number changes.',
    ],
  },
  {
    heading: '3. Requests, fares and payment',
    paragraphs: [
      'A fare quote is valid for a limited period and is calculated from the distance between the selected areas, the weight band of your package and the published pricing configuration. The full breakdown is shown before you pay.',
      'We only assign a rider after payment is confirmed. If payment fails, the request remains unpaid and is not dispatched.',
      'Fares are quoted and charged in Nigerian Naira (₦).',
    ],
  },
  {
    heading: '4. Cancellation and refunds',
    paragraphs: [
      'You may cancel a request from the app while it is not yet completed. Depending on how far the delivery has progressed, a cancellation fee may apply; the exact fee and any refund are shown before you confirm.',
      'Refunds are returned to the original payment method and are subject to your bank or payment provider processing times.',
    ],
  },
  {
    heading: '5. Package restrictions',
    paragraphs: [
      'You must not use TrustLink to send cash, prohibited or controlled items, hazardous materials, live animals, or anything illegal under Nigerian law. You must declare the contents accurately; we may refuse or return a package that breaches these restrictions.',
    ],
  },
  {
    heading: '6. Delivery and failed attempts',
    paragraphs: [
      'Delivery times are estimates and depend on traffic, weather and rider availability. If a delivery cannot be completed, we will tell you why and arrange one redelivery at no extra cost.',
      'A recipient code is issued for hand-over. The rider will ask the recipient for it at the drop-off point.',
    ],
  },
  {
    heading: '7. Liability',
    paragraphs: [
      'Our liability for loss or damage is limited to the fare paid for the affected delivery, except where Nigerian law provides otherwise.',
      'Nothing in these terms limits liability that cannot lawfully be limited.',
    ],
  },
  {
    heading: '8. Changes and governing law',
    paragraphs: [
      'We may update these terms as the service evolves; material changes will be communicated in the app before they take effect.',
      'These terms are governed by the laws of the Federal Republic of Nigeria, and the courts of the Federal Capital Territory have jurisdiction.',
    ],
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: '1. Who we are',
    paragraphs: [
      'TrustLink Logistics processes personal data as a data controller for the purpose of operating the delivery service. This notice explains what we collect and the choices you have under the Nigeria Data Protection Act (NDPA) 2023.',
    ],
  },
  {
    heading: '2. What we collect',
    paragraphs: [
      'Account data: your phone number, first and last name, and an optional email address.',
      'Delivery data: pickup and drop-off addresses and landmarks, package type, weight band, description, recipient name and phone number, and the status history of each delivery.',
      'Payment data: the payment reference and status returned by our payment provider. We do not store your full card number.',
      'Device data: a session token stored in your device secure store so you stay signed in.',
    ],
  },
  {
    heading: '3. Why we use it',
    paragraphs: [
      'To match a rider to your request, to let the rider and recipient complete the hand-over, to keep you informed of status changes, to calculate fares, to prevent fraud and misuse, and to provide support when something goes wrong.',
      'We rely on the performance of our contract with you, our legitimate interests in running a safe service, and your consent where we ask for it.',
    ],
  },
  {
    heading: '4. Who we share it with',
    paragraphs: [
      'Assigned riders receive the pickup and drop-off details and the recipient contact needed to complete the delivery. Payment providers receive the amount, reference and contact details needed to process your payment.',
      'SMS and messaging providers receive your phone number in order to deliver verification codes and status updates.',
      'We do not sell your personal data.',
    ],
  },
  {
    heading: '5. How long we keep it',
    paragraphs: [
      'Delivery records are retained while your account is active and for a limited period afterwards to meet tax, accounting and dispute-resolution obligations. Verification codes are short-lived and expire automatically.',
    ],
  },
  {
    heading: '6. Your rights',
    paragraphs: [
      'Under the NDPA you may request access to your personal data, ask us to correct it, request deletion, object to or restrict certain processing, and request a portable copy.',
      'You can edit your name and email in the app now. Other requests can be made through support, and we will respond within the timelines the NDPA requires.',
    ],
  },
  {
    heading: '7. Security and contact',
    paragraphs: [
      'Access to personal data is restricted to staff and riders who need it, and sessions are protected with device-level secure storage.',
      'Privacy questions can be raised through Help & support; contact details are shown there and will be replaced with the final support lines before launch.',
    ],
  },
];
