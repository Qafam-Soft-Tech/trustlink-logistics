/** Help & support content. Contact details are explicit placeholders (SC-31). */

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How do I track my delivery?',
    answer:
      'Open the Deliveries tab and tap the delivery, or use Track by number on the Home screen. Status refreshes by itself while the delivery is active.',
  },
  {
    question: 'What do the statuses mean?',
    answer:
      'Requested and Searching mean we are still matching a rider. Assigned, Picked up and In transit mean a rider has your package. Delivered, Failed, Returned and Cancelled are final states.',
  },
  {
    question: 'How is the fare calculated?',
    answer:
      'The fare combines a base charge, a distance charge and a weight charge. You always see the full breakdown before you pay, and there is a minimum fare for short trips.',
  },
  {
    question: 'Can I cancel after paying?',
    answer:
      'Yes, until the delivery is on the road. A cancellation fee may apply depending on how far the delivery has progressed, and the app shows the exact fee and refund before you confirm.',
  },
  {
    question: 'What happens if delivery fails?',
    answer:
      'We tell you why, and TrustLink arranges one redelivery at no extra cost. There is nothing you need to do — we will alert you when the redelivery starts.',
  },
  {
    question: 'Do you deliver outside Abuja?',
    answer:
      'Not yet. R1 covers selected Abuja areas only, and the app blocks requests outside them so you are never charged for a trip we cannot complete.',
  },
];

export interface ContactChannel {
  id: 'call' | 'whatsapp' | 'email';
  label: string;
  value: string;
  icon: string;
  url: string;
}

/** Placeholder contact details — replace with the real support lines before launch (SC-31). */
export const CONTACT_CHANNELS: ContactChannel[] = [
  { id: 'call', label: 'Call support', value: '+234 700 000 0000', icon: 'call-outline', url: 'tel:+2347000000000' },
  { id: 'whatsapp', label: 'WhatsApp', value: '+234 700 000 0000', icon: 'logo-whatsapp', url: 'https://wa.me/2347000000000' },
  { id: 'email', label: 'Email support', value: 'support@trustlink.ng', icon: 'mail-outline', url: 'mailto:support@trustlink.ng' },
];

export const SUPPORT_HOURS = 'Monday to Saturday, 8:00 – 20:00 (WAT)';

/** Per-status alert icon (Ionicons). */
export function alertIconFor(status: string): string {
  switch (status) {
    case 'requested':
      return 'time-outline';
    case 'searching':
      return 'sync-outline';
    case 'assigned':
      return 'bicycle-outline';
    case 'picked_up':
      return 'cube-outline';
    case 'in_transit':
      return 'car-outline';
    case 'delivered':
      return 'checkmark-circle-outline';
    case 'failed':
      return 'alert-circle-outline';
    case 'returned':
      return 'return-down-back-outline';
    case 'cancelled':
      return 'close-circle-outline';
    default:
      return 'notifications-outline';
  }
}
