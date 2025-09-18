"use client";

export const fetchFromApi = async (url: string, dataKey?: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }
        const data = await response.json();
        if (dataKey) {
            return data[dataKey];
        }
        return data;
    } catch (error) {
        console.error("Failed to fetch from API:", error);
        return [];
    }
}
