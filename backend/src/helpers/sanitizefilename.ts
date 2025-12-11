export function sanitizeFilename(czech: string): string {
    czech.replace
    return czech.replace(/\s/g, "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}