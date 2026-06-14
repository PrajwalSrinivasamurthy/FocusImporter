import { ConversionFlow } from "@/components/conversion/conversion-flow";

export default function ConversionPage() {
  return (
    <div className="space-y-10">
      <header>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-scarlet-600 dark:text-scarlet-400">
          Conversion
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-strong">
          One workbook in, three import files out.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Drop a school&apos;s student workbook below. It gets validated,
          split to match the Focus import mappings, and handed back -
          nothing is ever stored on disk.
        </p>
      </header>
      <ConversionFlow />
    </div>
  );
}
