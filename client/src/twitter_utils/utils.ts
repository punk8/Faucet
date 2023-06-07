"use strict";

export function isFaucetTwitterLink(twitterLink: string | null): boolean {
    try {
        // getAddress(address);
        if (twitterLink) {
            if (twitterLink.startsWith("https://twitter.com")) {
                // check twitter
                return true;
            }
            return false;
        }
        return false;
    } catch (error) { }
    return false;
}