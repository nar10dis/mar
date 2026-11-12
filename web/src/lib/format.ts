const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const longDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** Prix stockés en centimes */
export const formatPrice = (cents: number) => euros.format(cents / 100);
export const formatDate = (iso: string) => longDate.format(new Date(iso));
