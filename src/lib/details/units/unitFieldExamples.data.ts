import type { UnitFieldInput } from "./unitFieldTypes";

export const unitFieldExamples: UnitFieldInput[] = [
  {
    id: "system-id",
    label: "System ID",
    kind: "id",
    value: "srv_01HZYR9TBB9S5V7XK5A9M5M8Y7",
    copyable: true,
  },
  {
    id: "released-at",
    label: "Released At",
    kind: "datetime",
    value: "2026-02-15T18:25:00Z",
    format: {
      dateTime: {
        timezone: "America/New_York",
        dateStyle: "medium",
        timeStyle: "short",
      },
    },
  },
  {
    id: "last-sync",
    label: "Last Sync",
    kind: "relativeTime",
    value: Date.now() - 3 * 60 * 60 * 1000,
  },
  {
    id: "job-duration",
    label: "Job Duration",
    kind: "duration",
    value: 93600,
    format: {
      duration: {
        inputUnit: "s",
        style: "compact",
      },
    },
  },
  {
    id: "mrr",
    label: "Monthly Revenue",
    kind: "currency",
    value: 1250000.25,
    format: {
      currency: {
        currencyCode: "USD",
      },
    },
  },
  {
    id: "gross-margin",
    label: "Gross Margin",
    kind: "percent",
    value: 0.413,
    format: {
      percent: {
        decimals: 1,
      },
    },
  },
  {
    id: "rollout",
    label: "Rollout Progress",
    kind: "progress",
    value: 0.72,
    format: {
      progress: {
        percentBase: 1,
        showBar: true,
      },
    },
  },
  {
    id: "migration",
    label: "Migration Progress",
    kind: "progress",
    value: { current: 87, total: 120 },
    format: {
      progress: {
        clamp: true,
        showBar: true,
      },
    },
  },
  {
    id: "mfa-enabled",
    label: "MFA Enabled",
    kind: "boolean",
    value: true,
    format: {
      boolean: {
        trueLabel: "Enabled",
        falseLabel: "Disabled",
      },
    },
  },
  {
    id: "environment",
    label: "Environment",
    kind: "enum",
    value: "prod",
    format: {
      enum: {
        labels: {
          prod: "Production",
          stg: "Staging",
          dev: "Development",
        },
        unknownLabel: "Unknown Environment",
      },
    },
  },
  {
    id: "tags",
    label: "Tags",
    kind: "tags",
    value: ["enterprise", "regulated", "priority-a"],
  },
  {
    id: "artifact-size",
    label: "Artifact Size",
    kind: "bytes",
    value: 5368709120,
    format: {
      bytes: {
        base: 1024,
        precision: 2,
      },
    },
  },
  {
    id: "card-last4",
    label: "Card",
    kind: "masked",
    value: "4242424242424242",
    format: {
      masked: {
        maskPattern: "last4",
      },
    },
  },
  {
    id: "api-token",
    label: "API Token",
    kind: "tokenPreview",
    value: "tok_live_something_really_sensitive_1234567890",
    copyable: true,
    format: {
      token: {
        keepStart: 8,
        keepEnd: 0,
      },
    },
  },
  {
    id: "owner",
    label: "Owner",
    kind: "entityRef",
    value: {
      id: "usr_1001",
      label: "Taylor Morgan",
    },
    link: {
      onClick: () => {},
      ariaLabel: "Open owner profile",
    },
  },
  {
    id: "payload",
    label: "Payload",
    kind: "json",
    value: {
      retries: 2,
      dryRun: false,
      paths: ["imports/customers.csv", "imports/orders.csv"],
    },
  },
  {
    id: "documentation",
    label: "Documentation URL",
    kind: "url",
    value: "https://docs.example.com/platform/security",
    format: {
      url: {
        displayDomain: true,
      },
    },
  },
  {
    id: "support-email",
    label: "Support Email",
    kind: "email",
    value: "support@example.com",
  },
  {
    id: "support-phone",
    label: "Support Phone",
    kind: "phone",
    value: "+1-800-555-0188",
  },
  {
    id: "country",
    label: "Country",
    kind: "country",
    value: "US",
  },
  {
    id: "language",
    label: "Language",
    kind: "language",
    value: "en",
  },
  {
    id: "region-location",
    label: "Region Location",
    kind: "location",
    value: { lat: 40.7128, lng: -74.006 },
    format: {
      location: {
        mapLinkTemplate: "https://maps.google.com/?q={lat},{lng}",
      },
    },
  },
];
