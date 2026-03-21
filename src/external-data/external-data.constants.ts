import * as path from "path";

export type ExternalDataSourceCode =
  | "court_stan"
  | "court_dates"
  | "reestr"
  | "asvp";

export interface ExternalDataResourceDefinition {
  name: string;
  url: string;
}

export interface ExternalDataSourceDefinition {
  code: ExternalDataSourceCode;
  datasetUrl?: string;
  targetDirectory: string;
  indexedSource?: "court_stan" | "court_dates" | "asvp";
  resources: ExternalDataResourceDefinition[];
}

export const EXTERNAL_DATA_SOURCE_DEFINITIONS =
  "EXTERNAL_DATA_SOURCE_DEFINITIONS";

const parseUrls = (
  value: string | undefined,
  fallbackName: string,
): ExternalDataResourceDefinition[] => {
  return (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((url, index) => ({
      name: `${fallbackName}-${index + 1}`,
      url,
    }));
};

export const buildDefaultExternalDataDefinitions =
  (): ExternalDataSourceDefinition[] => [
    {
      code: "court_stan",
      datasetUrl: process.env.EXTERNAL_DATASET_URL_COURT_STAN,
      targetDirectory: path.resolve(process.cwd(), "court_stan"),
      indexedSource: "court_stan",
      resources: parseUrls(
        process.env.EXTERNAL_DATA_URLS_COURT_STAN,
        "court-stan",
      ),
    },
    {
      code: "court_dates",
      datasetUrl: process.env.EXTERNAL_DATASET_URL_COURT_DATES,
      targetDirectory: path.resolve(process.cwd(), "court_dates"),
      indexedSource: "court_dates",
      resources: parseUrls(
        process.env.EXTERNAL_DATA_URLS_COURT_DATES,
        "court-dates",
      ),
    },
    {
      code: "reestr",
      datasetUrl: process.env.EXTERNAL_DATASET_URL_REESTR,
      targetDirectory: path.resolve(process.cwd(), "reestr"),
      resources: parseUrls(process.env.EXTERNAL_DATA_URLS_REESTR, "reestr"),
    },
    {
      code: "asvp",
      datasetUrl: process.env.EXTERNAL_DATASET_URL_ASVP,
      targetDirectory: path.resolve(process.cwd(), "asvp"),
      indexedSource: "asvp",
      resources: parseUrls(process.env.EXTERNAL_DATA_URLS_ASVP, "asvp"),
    },
  ];
