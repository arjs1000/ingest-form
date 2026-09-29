import { useState } from 'react';

import { ICheckbox } from '@/core/components/ICheckbox';
import { IDateInput } from '@/core/components/IDateInput';
import { IFileUpload } from '@/core/components/IFileUpload';
import { IFormField } from '@/core/components/IFormField';
import { IFormSection } from '@/core/components/IFormSection';
import { IInput } from '@/core/components/IInput';
import { IPhoneInput } from '@/core/components/IPhoneInput';
import { IRadios } from '@/core/components/IRadios';
import { ISelect } from '@/core/components/ISelect';
import { IStepProgress } from '@/core/components/IStepProgress';
import { ISwitch } from '@/core/components/ISwitch';
import { ITextarea } from '@/core/components/ITextarea';

import { ShowcaseItem, ShowcaseSection } from '../showcase';

export function FormsSection() {
  const [enabled, setEnabled] = useState(true);
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  return (
    <ShowcaseSection id="forms" title="Forms" description="Native controls. Order is label, hint, error, control.">
      <ShowcaseItem name="IFormField + IInput" usage="Render prop wires id and ARIA">
        <IFormField id="demo-name" label="Full name" hint="As it appears on your NHS record">
          {(field) => <IInput {...field} autoComplete="off" />}
        </IFormField>
        <IFormField id="demo-postcode" label="Postcode" error="Enter a real postcode">
          {(field) => <IInput {...field} defaultValue="XYZ" />}
        </IFormField>
      </ShowcaseItem>
      <ShowcaseItem name="ISelect" usage="Native select, phones open their own picker">
        <IFormField id="demo-select" label="Document type">
          {(field) => (
            <ISelect {...field} defaultValue="">
              <option value="">Choose a document</option>
              <option value="a">New patient registration</option>
            </ISelect>
          )}
        </IFormField>
      </ShowcaseItem>
      <ShowcaseItem name="ITextarea" usage="maxChars shows a live character count">
        <IFormField id="demo-textarea" label="Describe the problem">
          {(field) => <ITextarea {...field} maxChars={200} defaultValue="I have had a cough for 3 weeks" />}
        </IFormField>
      </ShowcaseItem>
      <ShowcaseItem name="IRadios" usage="Fieldset + legend, inputProps for react-hook-form">
        <IRadios
          name="demo-radios"
          legend="Have you had this before?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'unsure', label: 'I am not sure', hint: 'We will ask a clinician' },
          ]}
        />
      </ShowcaseItem>
      <ShowcaseItem name="ICheckbox" usage="Native checkbox with label and hint">
        <ICheckbox id="demo-checkbox" label="I agree to share these documents" hint="You can withdraw at any time" />
      </ShowcaseItem>
      <ShowcaseItem name="ISwitch" usage="Admin settings that apply immediately">
        <ISwitch id="demo-switch" label="Accept photos" hint="JPG and PNG" checked={enabled} onCheckedChange={setEnabled} />
      </ShowcaseItem>
      <ShowcaseItem name="IPhoneInput" usage="Country select + number, value in E.164">
        <IFormField id="demo-phone" label="Mobile number" hint={phone ? `Value: ${phone}` : 'For example, 07123 456789'}>
          {(field) => <IPhoneInput {...field} value={phone} onChange={setPhone} />}
        </IFormField>
      </ShowcaseItem>
      <ShowcaseItem name="IPhoneInput disabled" usage="Flag and dial code greyed out with the number">
        <IFormField id="demo-phone-disabled" label="Mobile number">
          {(field) => <IPhoneInput {...field} value="+353851234567" onChange={() => {}} disabled />}
        </IFormField>
      </ShowcaseItem>
      <ShowcaseItem name="IDateInput" usage="Typed DD/MM/YYYY + calendar popover, value in ISO">
        <IFormField id="demo-date" label="Date of birth" hint={date ? `Value: ${date}` : 'For example, 15/03/1984'}>
          {(field) => <IDateInput {...field} value={date} onChange={setDate} />}
        </IFormField>
      </ShowcaseItem>
      <ShowcaseItem name="IFileUpload" usage="FilePond, one file, custom process callback" wide>
        <IFileUpload
          id="demo-file"
          label="Upload a document"
          hint="PDF, JPG or PNG, up to 10MB. Demo only: nothing is sent."
          acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
          maxFileSize={10 * 1024 * 1024}
          onProcessFile={() => new Promise((resolve) => setTimeout(resolve, 800))}
        />
      </ShowcaseItem>
      <ShowcaseItem name="IStepProgress" usage="Above the h1 in multi-step flows">
        <IStepProgress current={2} total={4} label="Upload documents" />
      </ShowcaseItem>
      <ShowcaseItem name="IFormSection" usage="collapsible uses native <details>" wide>
        <IFormSection title="Contact details" description="How we reach you" collapsible>
          <IFormField id="demo-section-field" label="Email address">
            {(field) => <IInput {...field} />}
          </IFormField>
        </IFormSection>
      </ShowcaseItem>
    </ShowcaseSection>
  );
}
