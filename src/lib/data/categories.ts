// Static categories data matching the database schema
// This allows the app to work without Supabase connection

export interface CategoryData {
    id: string;
    name: string;
    emoji: string;
    color: string;
    parentId?: string;
}

// System categories with stable IDs for local use
export const CATEGORIES: CategoryData[] = [
    { id: "facultad", name: "Facultad", emoji: "🎓", color: "#3b82f6" },
    { id: "kei", name: "KEI", emoji: "🚀", color: "#8b5cf6" },
    { id: "gym", name: "Gym", emoji: "💪", color: "#22c55e" },
    { id: "social", name: "Social", emoji: "🤝", color: "#eab308" },
    { id: "scroll", name: "Scroll", emoji: "📱", color: "#ef4444" },
    { id: "sueno", name: "Sueño", emoji: "💤", color: "#6366f1" },
    { id: "proyectos", name: "Proyectos Varios", emoji: "🎯", color: "#f97316" },
];

// Facultad subcategories
export const FACULTAD_SUBCATEGORIES: CategoryData[] = [
    { id: "dsi", name: "DSI", emoji: "📚", color: "#3b82f6", parentId: "facultad" },
    { id: "bd", name: "BD", emoji: "📚", color: "#3b82f6", parentId: "facultad" },
    { id: "com", name: "COM", emoji: "📚", color: "#3b82f6", parentId: "facultad" },
    { id: "an", name: "AN", emoji: "📚", color: "#3b82f6", parentId: "facultad" },
    { id: "ingles2", name: "Inglés 2", emoji: "📚", color: "#3b82f6", parentId: "facultad" },
    { id: "am1", name: "AM1", emoji: "📚", color: "#3b82f6", parentId: "facultad" },
    { id: "eco", name: "ECO", emoji: "📚", color: "#3b82f6", parentId: "facultad" },
    { id: "dsw", name: "DSW", emoji: "📚", color: "#3b82f6", parentId: "facultad" },
];

export function getCategoryById(id: string): CategoryData | undefined {
    return CATEGORIES.find(c => c.id === id) || FACULTAD_SUBCATEGORIES.find(c => c.id === id);
}

export function getSubcategories(parentId: string): CategoryData[] {
    if (parentId === "facultad") {
        return FACULTAD_SUBCATEGORIES;
    }
    return [];
}

export function hasSubcategories(categoryId: string): boolean {
    return categoryId === "facultad";
}
