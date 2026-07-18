declare module "*?url" {
  const url: string;
  export default url;
}

declare module "pdfjs-dist/build/pdf.mjs" {
  export const GlobalWorkerOptions: { workerSrc: string };
  export function getDocument(options: Record<string, unknown>): {
    promise: Promise<{
      numPages: number;
      getPage(pageNumber: number): Promise<{ getTextContent(): Promise<{ items: unknown[] }> }>;
      destroy(): Promise<void>;
    }>;
  };
}
