export function ownsApartment(player) {
    return player.apartment?.owned === true;
}

export const APARTMENT_REQUIRED = 'Buy the apartment for $900 before hiring workers or gambling.';
