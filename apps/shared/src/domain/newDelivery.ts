/**
 * New-delivery request draft — pure model for the create-delivery flow (FR-C04, FR-C07).
 * No React / React Native imports. The reducer + assembly are unit-tested in vitest.
 */
import type { CreateDeliveryInput, Delivery, PackageType } from './types';
import { SERVICE_AREAS } from './constants';
import { isValidNigerianPhone, toCanonicalPhone } from '../validation';

export const NEW_DELIVERY_STEPS = ['Pickup', 'Drop-off', 'Package', 'Sender', 'Review'] as const;
export type NewDeliveryStep = (typeof NEW_DELIVERY_STEPS)[number];

/** Weight chips are tier maxima; we send the upper bound as numeric kg (SC-6 / D16). */
export const WEIGHT_OPTIONS = [1, 5, 10, 25] as const;
export type WeightOption = (typeof WEIGHT_OPTIONS)[number];
export const DEFAULT_WEIGHT: Record<PackageType, WeightOption> = { document: 1, parcel: 5 };

export interface DraftAddress {
  label: string;
  street: string;
  landmark: string;
  area: string;
  city: string;
}

export interface DraftContact {
  name: string;
  phone: string;
}

export interface NewDeliveryDraft {
  pickup: DraftAddress;
  dropoff: DraftAddress;
  recipient: DraftContact;
  packageType: PackageType;
  packageWeight: WeightOption;
  packageDescription: string;
  sender: DraftContact;
}

export function emptyAddress(label = 'Home'): DraftAddress {
  return { label, street: '', landmark: '', area: '', city: 'Abuja' };
}

export function initialDraft(): NewDeliveryDraft {
  return {
    pickup: emptyAddress('Home'),
    dropoff: emptyAddress('Drop-off'),
    recipient: { name: '', phone: '' },
    packageType: 'parcel',
    packageWeight: DEFAULT_WEIGHT.parcel,
    packageDescription: '',
    sender: { name: '', phone: '' },
  };
}

/** True when the address's area is one of the R1 launch areas. */
export function isServiceableArea(area?: string | null): boolean {
  return Boolean(area) && (SERVICE_AREAS as readonly string[]).includes(area as string);
}

function addressError(address: DraftAddress): string | undefined {
  if (!address.street.trim() || address.street.trim().length < 3) return 'Enter a street (min 3 characters)';
  if (!address.area) return 'Choose an area';
  if (!isServiceableArea(address.area)) return "We don't deliver to this area yet";
  return undefined;
}

export type StepErrors = Record<string, string>;

/** Inline validation for a single step (one decision per screen). */
export function validateStep(step: NewDeliveryStep, draft: NewDeliveryDraft): StepErrors {
  const errors: StepErrors = {};
  switch (step) {
    case 'Pickup': {
      const err = addressError(draft.pickup);
      if (err) errors.pickup = err;
      break;
    }
    case 'Drop-off': {
      const err = addressError(draft.dropoff);
      if (err) errors.dropoff = err;
      if (!draft.recipient.name.trim()) errors.recipientName = 'Enter the recipient name';
      if (!isValidNigerianPhone(draft.recipient.phone)) {
        errors.recipientPhone = 'Enter a valid Nigerian phone number';
      } else if (
        draft.sender.phone.trim() &&
        toCanonicalPhone(draft.recipient.phone) === toCanonicalPhone(draft.sender.phone)
      ) {
        errors.recipientPhone = 'Recipient must be different from the sender';
      }
      break;
    }
    case 'Package': {
      if (!WEIGHT_OPTIONS.includes(draft.packageWeight)) errors.packageWeight = 'Choose a weight';
      break;
    }
    case 'Sender': {
      if (!draft.sender.name.trim()) errors.senderName = 'Enter the sender name';
      if (!isValidNigerianPhone(draft.sender.phone)) errors.senderPhone = 'Enter a valid Nigerian phone number';
      break;
    }
    case 'Review':
    default:
      break;
  }
  return errors;
}

function optional(value: string | undefined): string | undefined {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Assemble the exact `CreateDeliveryDto` body. Only the 16 contract fields are emitted —
 * no lat/lng (no maps in R1), no extra keys.
 */
export function toCreateDeliveryInput(draft: NewDeliveryDraft): CreateDeliveryInput {
  return {
    pickupStreet: draft.pickup.street.trim(),
    pickupLandmark: optional(draft.pickup.landmark),
    pickupArea: optional(draft.pickup.area),
    dropoffStreet: draft.dropoff.street.trim(),
    dropoffLandmark: optional(draft.dropoff.landmark),
    dropoffArea: optional(draft.dropoff.area),
    packageType: draft.packageType,
    packageWeight: draft.packageWeight,
    packageDescription: optional(draft.packageDescription),
    senderName: draft.sender.name.trim(),
    senderPhone: toCanonicalPhone(draft.sender.phone),
    recipientName: draft.recipient.name.trim(),
    recipientPhone: toCanonicalPhone(draft.recipient.phone),
  };
}

/** A draft counts as "dirty" once the user has entered request data (sender auto-prefill doesn't count). */
export function isDraftDirty(draft: NewDeliveryDraft): boolean {
  return Boolean(
    draft.pickup.street.trim() ||
      draft.pickup.area ||
      draft.dropoff.street.trim() ||
      draft.dropoff.area ||
      draft.recipient.name.trim() ||
      draft.recipient.phone.trim() ||
      draft.packageDescription.trim(),
  );
}

export type DraftAction =
  | { type: 'setPickup'; value: DraftAddress }
  | { type: 'setDropoff'; value: DraftAddress }
  | { type: 'patchRecipient'; patch: Partial<DraftContact> }
  | { type: 'setPackageType'; value: PackageType }
  | { type: 'setWeight'; value: WeightOption }
  | { type: 'setDescription'; value: string }
  | { type: 'patchSender'; patch: Partial<DraftContact> }
  | { type: 'hydrate'; value: NewDeliveryDraft }
  | { type: 'reset' };

export function draftReducer(state: NewDeliveryDraft, action: DraftAction): NewDeliveryDraft {
  switch (action.type) {
    case 'setPickup':
      return { ...state, pickup: action.value };
    case 'setDropoff':
      return { ...state, dropoff: action.value };
    case 'patchRecipient':
      return { ...state, recipient: { ...state.recipient, ...action.patch } };
    case 'setPackageType':
      return { ...state, packageType: action.value, packageWeight: DEFAULT_WEIGHT[action.value] };
    case 'setWeight':
      return { ...state, packageWeight: action.value };
    case 'setDescription':
      return { ...state, packageDescription: action.value };
    case 'patchSender':
      return { ...state, sender: { ...state.sender, ...action.patch } };
    case 'hydrate':
      return action.value;
    case 'reset':
      return initialDraft();
    default:
      return state;
  }
}

/** Smallest weight chip that covers a past delivery's weight. */
export function weightOptionFor(weightKg: number): WeightOption {
  return WEIGHT_OPTIONS.find((option) => option >= weightKg) ?? WEIGHT_OPTIONS[WEIGHT_OPTIONS.length - 1];
}

type RepeatableDelivery = Pick<
  Delivery,
  | 'pickupStreet'
  | 'pickupLandmark'
  | 'pickupArea'
  | 'dropoffStreet'
  | 'dropoffLandmark'
  | 'dropoffArea'
  | 'packageType'
  | 'packageWeight'
  | 'packageDescription'
  | 'senderName'
  | 'senderPhone'
  | 'recipientName'
  | 'recipientPhone'
>;

/** "Send again" — build a fresh draft from a past delivery. */
export function draftFromDelivery(delivery: RepeatableDelivery): NewDeliveryDraft {
  return {
    pickup: {
      label: 'Pickup',
      street: delivery.pickupStreet,
      landmark: delivery.pickupLandmark ?? '',
      area: delivery.pickupArea ?? '',
      city: 'Abuja',
    },
    dropoff: {
      label: 'Drop-off',
      street: delivery.dropoffStreet,
      landmark: delivery.dropoffLandmark ?? '',
      area: delivery.dropoffArea ?? '',
      city: 'Abuja',
    },
    recipient: { name: delivery.recipientName, phone: delivery.recipientPhone },
    packageType: delivery.packageType,
    packageWeight: weightOptionFor(delivery.packageWeight),
    packageDescription: delivery.packageDescription ?? '',
    sender: { name: delivery.senderName, phone: delivery.senderPhone },
  };
}
