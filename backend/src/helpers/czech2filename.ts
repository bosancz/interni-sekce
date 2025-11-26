export function czech2Filename(czech: string): string {
    return czech.replace(" ", "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}