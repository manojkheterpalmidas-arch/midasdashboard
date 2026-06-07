import Papa from "papaparse";

export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => (typeof value === "string" ? value.trim() : value),
      complete: (result) => {
        if (result.errors?.length) reject(new Error(result.errors[0].message));
        else resolve(result.data);
      },
      error: reject
    });
  });
}

export function toCsv(rows, columns) {
  return Papa.unparse(rows, { columns, quotes: false, newline: "\r\n" });
}

export function downloadText(filename, text, type = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
