export type BookStatus = "Lu" | "En cours" | "Dans ma PAL" | "Acheté" | "Abandonné" | "Wishlist" | "Lecture en cours" | "Lecture terminée" | "Prêté" | "Emprunté";

export interface Citation {
  id: string;
  text: string;
  page?: number;
  chapter?: number;
}

export interface PassageEntry {
  id: string;
  text: string;
  chapter?: number;
  page?: number;
}

export interface PersonnageEntry {
  id: string;
  text: string;
}

export interface ChapterNoteEntry {
  id: string;
  text: string;
  chapter?: number;
  page?: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  rating?: number;
  coupDeCoeur?: boolean;
  status: string;
  secondaryStatus?: string;
  genre?: string;
  format?: string;
  publisher?: string;
  series?: string;
  pages?: number;
  pagesRead?: number;
  chapters?: number;
  publicationDate?: string;
  price?: number;
  spicyLevel?: number;
  matureContent?: boolean;
  recommandationDuMois?: boolean;
  recommandationMonth?: string;
  startDate?: string;
  endDate?: string;
  avis?: string;
  citations?: Citation[];
  passagesPreferes?: PassageEntry[];
  personnagesPreferes?: PersonnageEntry[];
  chapterNotes?: ChapterNoteEntry[];
  chapterNotesEnabled?: boolean;
  loanDate?: string;
  borrowerName?: string;
  borrowDate?: string;
  returnDate?: string;
  lenderName?: string;
  rereadCount?: number;
  synopsis?: string;
  isbn?: string;
  acquiredFromWishlist?: boolean;
}

export const mockBooks: Book[] = [
  { id: "1", title: "L'Étranger", author: "Albert Camus", coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=180&h=244&fit=crop", rating: 5, coupDeCoeur: true, status: "Lecture terminée", genre: "Contemporain", format: "Poche", publisher: "Gallimard", pages: 185, pagesRead: 185, chapters: 6 },
  { id: "2", title: "Le Petit Prince", author: "Antoine de Saint-Exupéry", coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=180&h=244&fit=crop", rating: 4, status: "Lecture terminée", genre: "Conte", format: "Relié", pages: 96, pagesRead: 96 },
  { id: "3", title: "Germinal", author: "Émile Zola", coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=180&h=244&fit=crop", status: "Lecture en cours", genre: "Classique", format: "Broché", pages: 592, pagesRead: 120, chapters: 7 },
  { id: "4", title: "Les Misérables", author: "Victor Hugo", status: "Wishlist", genre: "Classique", format: "Poche", pages: 1900 },
];
