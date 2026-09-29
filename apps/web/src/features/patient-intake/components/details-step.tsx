import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { Controller, useForm } from 'react-hook-form';

import { IBackBar } from '@/core/components/IBackBar';
import { IButton } from '@/core/components/IButton';
import { IContainer } from '@/core/components/IContainer';
import { IDateInput } from '@/core/components/IDateInput';
import { IErrorSummary, type IErrorSummaryItem } from '@/core/components/IErrorSummary';
import { IFormField } from '@/core/components/IFormField';
import { IFormSection } from '@/core/components/IFormSection';
import { IInput } from '@/core/components/IInput';
import { IPageHeader } from '@/core/components/IPageHeader';
import { IPhoneInput } from '@/core/components/IPhoneInput';
import { IRadios } from '@/core/components/IRadios';
import { IStepProgress } from '@/core/components/IStepProgress';
import { IText } from '@/core/components/IText';

import { GENDER_LABELS, INTAKE_TOTAL_STEPS, PATIENT_COUNTRY, PATIENT_GENDERS } from '../constants';
import {
  PATIENT_DETAILS_FIELD_ORDER,
  patientDetailsSchema,
  type PatientDetailsField,
  type PatientDetailsValues,
} from '../schemas/patient-details.schema';
import { useIntakeDraftStore } from '../store/intake-draft.store';
import { fromExtractedFields } from '../utils/from-extracted-fields';
import { DeveloperDataSheet } from './developer-data-sheet';

const EMPTY_VALUES: Omit<PatientDetailsValues, 'gender'> = {
  firstNames: '',
  lastName: '',
  email: '',
  dateOfBirth: '',
  mobileNumber: '',
  phoneNumber: '',
  addressLine1: '',
  addressLine2: '',
  addressLine3: '',
  postcode: '',
  country: PATIENT_COUNTRY,
};

const GENDER_OPTIONS = PATIENT_GENDERS.map((value) => ({ value, label: GENDER_LABELS[value] }));

// Error-summary link targets: the control's id, or the first radio for the gender group.
const fieldId = (field: PatientDetailsField) => (field === 'gender' ? 'gender-male' : field);

/** Step 2: the details found in the document, pre-filled and editable. */
export function DetailsStep() {
  const navigate = useNavigate();
  const sessionId = useIntakeDraftStore((s) => s.sessionId);
  const extraction = useIntakeDraftStore((s) => s.extraction);
  const savedDetails = useIntakeDraftStore((s) => s.details);
  const setDetails = useIntakeDraftStore((s) => s.setDetails);

  const prefilled = extraction ? fromExtractedFields(extraction.fields) : {};

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<PatientDetailsValues>({
    resolver: zodResolver(patientDetailsSchema),
    // Coming back after "Try again" keeps what was submitted; otherwise start from the document.
    defaultValues: savedDetails ?? { ...EMPTY_VALUES, ...prefilled },
    // NHS pattern: focus goes to the error summary, whose links lead to each field.
    shouldFocusError: false,
  });

  /** "From your document" on pre-filled fields, before any other hint. */
  const hint = (field: PatientDetailsField, extra?: string) =>
    [field in prefilled ? 'From your document.' : undefined, extra].filter(Boolean).join(' ') || undefined;

  const summary: IErrorSummaryItem[] = PATIENT_DETAILS_FIELD_ORDER.flatMap((field) => {
    const message = errors[field]?.message;
    return message ? [{ fieldId: fieldId(field), message }] : [];
  });

  const onValid = (values: PatientDetailsValues) => {
    setDetails(values);
    void navigate({ to: '/patient-upload/submitting' });
  };

  if (!sessionId) return null;

  return (
    <>
      <IBackBar>
        <Link to="/patient-upload/document">Back</Link>
      </IBackBar>
      <IContainer className="flex flex-col gap-8 pt-8 md:pt-12">
        <IPageHeader
          eyebrow={<IStepProgress current={2} total={INTAKE_TOTAL_STEPS} label="Your details" />}
          title="Check your details"
          description={
            Object.keys(prefilled).length > 0
              ? 'We filled in what we found in your document. Check everything and correct anything that is wrong.'
              : 'Enter your details. We use them to register you with your GP practice.'
          }
        />

        <form noValidate onSubmit={handleSubmit(onValid)} className="flex max-w-2xl flex-col gap-8">
          {/* key remounts the summary on each failed submit so it takes focus again. */}
          {summary.length > 0 ? <IErrorSummary key={submitCount} errors={summary} /> : null}

          <IFormSection title="Your name">
            <IFormField id="firstNames" label="First names" hint={hint('firstNames')} error={errors.firstNames?.message}>
              {(field) => <IInput {...field} {...register('firstNames')} autoComplete="given-name" />}
            </IFormField>
            <IFormField id="lastName" label="Last name" hint={hint('lastName')} error={errors.lastName?.message}>
              {(field) => <IInput {...field} {...register('lastName')} autoComplete="family-name" />}
            </IFormField>
          </IFormSection>

          <IFormSection title="Contact">
            <IFormField
              id="email"
              label="Email address"
              hint={hint('email', 'We will only use this to contact you about your registration.')}
              error={errors.email?.message}
            >
              {(field) => <IInput {...field} {...register('email')} type="email" inputMode="email" autoComplete="email" spellCheck={false} />}
            </IFormField>
            <IFormField
              id="mobileNumber"
              label="Mobile number"
              hint={hint('mobileNumber', 'For example, 07123 456789.')}
              error={errors.mobileNumber?.message}
            >
              {(field) => (
                <Controller
                  control={control}
                  name="mobileNumber"
                  render={({ field: { value, onChange, onBlur, ref, name } }) => (
                    <IPhoneInput {...field} name={name} ref={ref} value={value} onChange={onChange} onBlur={onBlur} autoComplete="tel" />
                  )}
                />
              )}
            </IFormField>
            <IFormField
              id="phoneNumber"
              label="Other phone number (optional)"
              hint={hint('phoneNumber', 'A landline or work number, if you have one.')}
              error={errors.phoneNumber?.message}
            >
              {(field) => (
                <Controller
                  control={control}
                  name="phoneNumber"
                  render={({ field: { value, onChange, onBlur, ref, name } }) => (
                    <IPhoneInput {...field} name={name} ref={ref} value={value} onChange={onChange} onBlur={onBlur} autoComplete="off" />
                  )}
                />
              )}
            </IFormField>
          </IFormSection>

          <IFormSection title="About you">
            <IFormField
              id="dateOfBirth"
              label="Date of birth"
              hint={hint('dateOfBirth', 'For example, 15/03/1984.')}
              error={errors.dateOfBirth?.message}
            >
              {(field) => (
                <Controller
                  control={control}
                  name="dateOfBirth"
                  render={({ field: { value, onChange, onBlur, ref, name } }) => (
                    <IDateInput {...field} name={name} ref={ref} value={value} onChange={onChange} onBlur={onBlur} />
                  )}
                />
              )}
            </IFormField>
            <IRadios
              name="gender"
              legend="Gender"
              hint={hint('gender')}
              error={errors.gender?.message}
              options={GENDER_OPTIONS}
              inputProps={register('gender')}
            />
          </IFormSection>

          <IFormSection title="Address">
            <IFormField id="addressLine1" label="Address line 1" hint={hint('addressLine1')} error={errors.addressLine1?.message}>
              {(field) => <IInput {...field} {...register('addressLine1')} autoComplete="address-line1" />}
            </IFormField>
            <IFormField id="addressLine2" label="Town or city" hint={hint('addressLine2')} error={errors.addressLine2?.message}>
              {(field) => <IInput {...field} {...register('addressLine2')} autoComplete="address-level2" />}
            </IFormField>
            <IFormField id="addressLine3" label="County (optional)" hint={hint('addressLine3')} error={errors.addressLine3?.message}>
              {(field) => <IInput {...field} {...register('addressLine3')} autoComplete="address-level1" />}
            </IFormField>
            <IFormField id="postcode" label="Postcode" hint={hint('postcode')} error={errors.postcode?.message}>
              {(field) => (
                <IInput {...field} {...register('postcode')} autoComplete="postal-code" autoCapitalize="characters" spellCheck={false} className="max-w-48" />
              )}
            </IFormField>
            <IText as="p" tone="secondary">
              Country: {PATIENT_COUNTRY}. We can only accept UK addresses.
            </IText>
          </IFormSection>

          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <IButton type="submit">Submit</IButton>
            <DeveloperDataSheet control={control} sessionId={sessionId} extraction={extraction} />
          </div>
        </form>
      </IContainer>
    </>
  );
}
