/**
 * Converts a milliseconds time value to an ISO date string.
 * @param millis Time in milliseconds
 * @returns {string} ISO date string
 */
export function formatMillisAsISODateString(millis: number) {
    return new Date(millis).toISOString().slice(0, 10);
}

/**
 * Converts a time value to an ISO date string.
 * @param date Time as date
 * @returns {string} ISO date string
 */
export function formatDateAsISODateString(date: Date) {
    const isoDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return isoDate.toISOString().slice(0, 10);
}

/**
 * Format a data type name for human readers.
 *
 * @param name fully qualified data type name
 * @param fullyQualified if the type name should be (kept) fully qualified
 * @returns {any}
 */
export function formatDataTypeName(name: string|null, fullyQualified: boolean): string {
    if (name && !fullyQualified) {
        const indexColon = name.lastIndexOf(':');
        if (indexColon >= 1) {
            name = name.substr(0, indexColon);
        }
        const indexDot = name.lastIndexOf('.');
        if (indexDot >= 0) {
            name = name.substr(indexDot + 1);
        }
    }
    return name;
}
