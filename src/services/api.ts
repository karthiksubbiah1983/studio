"use client";

export const fetchFromApi = async (url: string, dataKey?: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }
        const data = await response.json();
        if (dataKey) {
            // Handle dot notation for nested keys
            return dataKey.split('.').reduce((acc, part) => acc && acc[part], data);
        }
        return data;
    } catch (error) {
        console.error("Failed to fetch from API:", error);
        return [];
    }
}
