import { Button } from "@/components/ui/button";
import { ZipDropzone } from "@/components/analyzer/ZipDropzone";

interface TwoZipPanelProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  firstName: string | null;
  secondName: string | null;
  disabled?: boolean;
  onFirstFile: (file: File) => void;
  onSecondFile: (file: File) => void;
}

export function TwoZipPanel({
  enabled,
  onEnabledChange,
  firstName,
  secondName,
  disabled,
  onFirstFile,
  onSecondFile,
}: TwoZipPanelProps) {
  return (
    <div className="space-y-3">
      <Button
        type="button"
        size="sm"
        variant={enabled ? "default" : "outline"}
        className="w-full"
        aria-pressed={enabled}
        onClick={() => onEnabledChange(!enabled)}
      >
        Compare two exports
      </Button>
      {enabled ? (
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-muted">
            Drop two ZIPs in any order. Dates decide which is older — nothing is saved on this
            device.
          </p>
          <ZipDropzone
            compact
            disabled={disabled}
            label={firstName ? `First: ${firstName}` : "Drop the first export .zip"}
            onFile={onFirstFile}
          />
          <ZipDropzone
            compact
            disabled={disabled}
            label={secondName ? `Second: ${secondName}` : "Drop the second export .zip"}
            onFile={onSecondFile}
          />
        </div>
      ) : null}
    </div>
  );
}
