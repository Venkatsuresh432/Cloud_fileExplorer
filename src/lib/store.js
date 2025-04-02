import { writable } from "svelte/store";
import Cookies from "js-cookie";

export const userStore = writable(null);


if (typeof window !== "undefined") {
    const storedUser = Cookies.get("user");
    if (storedUser) {
        userStore.set(JSON.parse(storedUser));
    }
}

userStore.subscribe(value => {
    if (value) {
        Cookies.set("user", JSON.stringify(value), { expires: 1, path: '/' });
    } else {
        Cookies.remove("user");
    }
});


export function storeCopiedItems(paths) {
    Cookies.set("copiedItems", JSON.stringify(paths), { expires: 1, path: '/' });
}

export function getCopiedItems() {
    const copied = Cookies.get("copiedItems");
    return copied ? JSON.parse(copied) : null;
}

export function clearCopiedItems() {
    Cookies.remove("copiedItems");
}