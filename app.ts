
import { file, write } from "bun";

async function convertSnapshotsToCsv() {
  const jsonPath = "./src/lib/json/vendors.json";
  const csvPath = "./src/lib/json/vendors.csv";

  try {
    // Read and parse the JSON file using Bun's native API
    const data = await file(jsonPath).json();

    if (!Array.isArray(data) || data.length === 0) {
      console.error("Error: snapshots.json is empty or not an array.");
      return;
    }

    // Extract headers from the first object's keys
    const headers = Object.keys(data[0]);

    // Map JSON objects to CSV rows
    const csvRows = data.map((row) => {
      return headers
        .map((header) => {
          let value = row[header];

          // Handle null/undefined
          if (value === null || value === undefined) value = "";
          
          // Stringify nested objects/arrays (common in procurement snapshots)
          if (typeof value === "object") value = JSON.stringify(value);

          // Escape quotes and wrap strings containing commas, quotes, or newlines
          value = String(value).replace(/"/g, '""');
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            value = `"${value}"`;
          }

          return value;
        })
        .join(",");
    });

    // Combine headers and data rows
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // Write to the new CSV file
    await write(csvPath, csvContent);
    console.log(`✅ Successfully converted snapshots to ${csvPath}`);
    
  } catch (error) {
    console.error("❌ Failed to convert JSON to CSV:", error);
  }
}

convertSnapshotsToCsv();