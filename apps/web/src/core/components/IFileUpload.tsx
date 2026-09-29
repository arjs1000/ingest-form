import 'filepond/dist/filepond.min.css';

import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import { FilePond, registerPlugin } from 'react-filepond';

import { cn } from '@/core/lib/cn';

registerPlugin(FilePondPluginFileValidateType, FilePondPluginFileValidateSize);

const DEFAULT_LABEL_IDLE = 'Drag your file here or <span class="filepond--label-action">choose a file</span>';

export interface IFileUploadProps {
  /** Id of FilePond's file input; the visible label points at it. */
  id: string;
  label: string;
  /** Accepted types and size in words, e.g. "PDF, JPG or PNG, up to 10MB". */
  hint?: string;
  /** Field-level error (Forms error pattern). Per-file errors show inside the file row. */
  error?: string;
  /** MIME types, e.g. ['application/pdf', 'image/jpeg']. */
  acceptedFileTypes: readonly string[];
  /** Largest file in bytes. */
  maxFileSize: number;
  /**
   * Uploads one file. Resolve when done; reject with an Error whose message is shown on the
   * file row ("Failed: <message>"). Runs through FilePond's custom `server.process`.
   */
  onProcessFile: (file: File) => Promise<void>;
  /** Called when the person removes a file. */
  onRemoveFile?: () => void;
  /** One file today; the prop exists so a later flow can accept several. */
  allowMultiple?: boolean;
  disabled?: boolean;
  /** FilePond's idle text (HTML). The `.filepond--label-action` span is the "choose" link. */
  labelIdle?: string;
  className?: string;
}

const MB = 1024 * 1024;

/**
 * File upload built on FilePond, restyled to the tokens (styles.css, "FilePond"). Tapping the
 * drop area opens the phone's picker (files or camera); drag and drop is an enhancement.
 * Validation of type and size happens before upload, with plain-English messages.
 */
export function IFileUpload({
  id,
  label,
  hint,
  error,
  acceptedFileTypes,
  maxFileSize,
  onProcessFile,
  onRemoveFile,
  allowMultiple = false,
  disabled = false,
  labelIdle = DEFAULT_LABEL_IDLE,
  className,
}: IFileUploadProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn('IFileUpload flex flex-col gap-2', error && 'border-l-4 border-error pl-4', className)}>
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="font-semibold text-error">
          <span className="sr-only">Error: </span>
          {error}
        </p>
      ) : null}
      <FilePond
        id={id}
        name={id}
        credits={false}
        disabled={disabled}
        allowMultiple={allowMultiple}
        maxFiles={allowMultiple ? null : 1}
        allowRevert={false}
        instantUpload
        acceptedFileTypes={[...acceptedFileTypes]}
        labelFileTypeNotAllowed="This file type is not accepted"
        fileValidateTypeLabelExpectedTypes="Choose a PDF, JPG or PNG"
        fileSizeBase={1024}
        maxFileSize={`${Math.round(maxFileSize / MB)}MB`}
        labelMaxFileSizeExceeded="The file is too large"
        labelMaxFileSize="Choose a file up to {filesize}"
        labelIdle={labelIdle}
        labelFileProcessing="Uploading"
        labelFileProcessingComplete="Uploaded"
        labelFileProcessingError={(fileError: { body?: string } | null) => `Failed: ${fileError?.body ?? 'try again'}`}
        labelTapToCancel="tap to cancel"
        labelTapToRetry="tap to try again"
        labelTapToUndo="tap to remove"
        onremovefile={() => onRemoveFile?.()}
        server={{
          process: (_fieldName, file, _metadata, load, fail, progress, abort) => {
            let aborted = false;
            // No byte-level progress from fetch: show an indeterminate spinner until it finishes.
            progress(false, 0, 0);
            onProcessFile(file as File).then(
              () => {
                if (!aborted) load(file.name);
              },
              (reason: unknown) => {
                if (!aborted) fail(reason instanceof Error ? reason.message : 'Upload failed');
              },
            );
            return {
              abort: () => {
                aborted = true;
                abort();
              },
            };
          },
        }}
      />
    </div>
  );
}
