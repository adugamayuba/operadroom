/** Simulated ingest pipeline steps for Plant Memory demo */

export interface IngestStep {
  id: string;
  label: string;
  detail: string;
  durationMs: number;
}

export const INGEST_STEPS: IngestStep[] = [
  { id: "scan", label: "Batch received", detail: "847 scanned pages · Archive B · CDU-1", durationMs: 600 },
  { id: "ocr", label: "Vision OCR", detail: "Handwriting + faded type · DE/EN mixed", durationMs: 1400 },
  { id: "extract", label: "Entity extraction", detail: "Tag IDs · dates · equipment · FL codes", durationMs: 1200 },
  { id: "link", label: "Asset graph link", detail: "156 tags ↔ 312 documents", durationMs: 900 },
  { id: "index", label: "Semantic index", detail: "12,403 entities · searchable", durationMs: 800 },
  { id: "seal", label: "Reelin ID seal", detail: "Archive batch cryptographically verified", durationMs: 500 },
];

export const INGEST_COMPLETE_STATS = {
  pages: 847,
  docs: 312,
  tags: 156,
  entities: 12403,
  lowConfidence: 23,
  qaQueue: 23,
};
