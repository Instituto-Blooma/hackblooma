import { useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFieldContext } from '../core/form-hook';
import type { FieldViewProps } from '../core/form-types';
import { FieldWrapper } from './field-wrapper';
import { fieldErrorMessage } from '../core/errors';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';

type FileFieldViewProps = FieldViewProps & {
  accept?: string;
  changeListener?: (value: string | null) => void;
};

export function FileFieldView({
  label,
  description,
  disabled,
  className,
  accept,
  changeListener,
  'data-testid': dataTestId,
}: FileFieldViewProps) {
  const field = useFieldContext<string | null>();
  const inputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const fileUrl = useQuery(
    api.files.getUrl,
    field.state.value ? { storageId: field.state.value as Id<'_storage'> } : 'skip'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>();
  const validationError = fieldErrorMessage(field.state.meta.errors, field.state.meta.errorMap);
  const error = uploadError ?? validationError;

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(undefined);
    try {
      const uploadUrl = await generateUploadUrl({});
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      const { storageId } = (await response.json()) as { storageId: string };
      field.handleChange(storageId);
      changeListener?.(storageId);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
      className={className}
      data-testid={dataTestId}
    >
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept ?? '*/*'}
          className="hidden"
          data-testid={dataTestId ? `${dataTestId}-input` : undefined}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleUpload(file);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || isUploading}
          data-testid={dataTestId}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
          {field.state.value ? 'Replace file' : 'Upload file'}
        </Button>
        {fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary underline-offset-4 hover:underline"
            data-testid={dataTestId ? `${dataTestId}-link` : undefined}
          >
            View uploaded file
          </a>
        ) : null}
      </div>
    </FieldWrapper>
  );
}
