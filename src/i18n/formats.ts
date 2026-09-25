export const formats = {
  dateTime: {
    short: {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
    long: {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
    dateTime: {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  },
  number: {
    integer: {
      maximumFractionDigits: 0,
    },
  },
} as const;
