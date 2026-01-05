export function string2Date(stringDate: string|null|undefined): Date|null{
        if (!stringDate) return null;

        const date = new Date(stringDate);
        
        if (isNaN(date.getTime())) {
            return null;
        }
        return date;
    }