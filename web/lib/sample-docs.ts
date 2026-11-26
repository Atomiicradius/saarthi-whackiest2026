// Made-up documents for the demo, so nobody has to upload a real certificate. No real data.
export function makeSampleFile(docKey: string, label: string): File {
  const body = [
    `SAMPLE ${label.toUpperCase()}`,
    "",
    "This is a sample document made up for the Saarthi demo.",
    "It is not a real certificate and holds no real personal data.",
    "",
    `Document type : ${docKey}`,
    "Student       : Ravi (sample)",
    "Issued by     : Sample Office, Sample District",
  ].join("\n");
  return new File([body], `sample-${docKey}.txt`, { type: "text/plain" });
}
