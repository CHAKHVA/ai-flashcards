export interface Flashcard {
    id: number,
    front: string;
    back: string;
    hint?: string;
    tags?: string[];
    bucket: number;
}
